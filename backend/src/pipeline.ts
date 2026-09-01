import { scrapeAllEvents } from "./apifyScraper";
import { mapEventWithLLM } from "./llmMapper";
import { findEmailViaGoogleSearch } from "./emailFinder";
import { pushLeadToInstantly } from "./instantlyClient";
import { submitEventToCohortApi, createSubcommunity, getAdminInviteLink, getEventDetails, getSubcommunityDetails } from "./apiClient";
import { createPipelineRun, completePipelineRun, upsertOrganization, insertContact, insertEvent } from "./db";

export async function processUrl(targetUrl: string, onLog: (msg: string) => void = console.log, preScrapedData?: any) {
    onLog(`\n\n================================================================`);
    onLog(`PROCESSING URL: ${targetUrl}`);
    onLog(`================================================================`);
    
    let runId = "unknown";
    try {
        runId = await createPipelineRun(targetUrl);
    } catch (e) {
        onLog("⚠️ Failed to create pipeline run record in DB. Continuing anyway...");
    }

    let fullLog = "";
    const log = (msg: string) => {
        fullLog += msg + "\n";
        onLog(msg);
    };

    try {
        // 1. Scrape specific Event
        let rawEvents: any[] = [];
        
        if (preScrapedData) {
            log("🚀 Using pre-scraped batch data from Apify Request Queue...");
            rawEvents = [preScrapedData];
        } else if (!targetUrl.includes('district.in')) {
            rawEvents = await scrapeAllEvents(targetUrl);
        }
        
        if (rawEvents.length === 0 || !rawEvents[0].fullPageText) {
            log("⚠️ Apify Playwright timed out or returned empty. Falling back to Cheerio / Axios...");
            const axios = require('axios');
            const cheerio = require('cheerio');
            try {
                const res = await axios.get(targetUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
                });
                const $ = cheerio.load(res.data);
                
                let rawJsonLds: string[] = [];
                if (!targetUrl.includes('district.in')) {
                    $('script[type="application/ld+json"]').each((_: any, el: any) => {
                        rawJsonLds.push($(el).html() || "");
                    });
                    const nextData = $('#__NEXT_DATA__').html();
                    if (nextData) rawJsonLds.push(nextData);
                }

                $('script').remove();
                $('style').remove();
                
                let pageTitle = $('title').text();
                pageTitle = pageTitle.replace(/Book tickets to /gi, "").split('- Buy')[0].trim();
                
                rawEvents = [{
                    url: targetUrl,
                    title: pageTitle,
                    description: $('meta[name="description"]').attr('content'),
                    fullPageText: $('body').text().replace(/\s+/g, ' ').substring(0, 8000),
                    rawJsonLds: rawJsonLds,
                    hasComments: false
                }];
            } catch(err) {
                log("❌ Cheerio fallback failed: " + err);
                await completePipelineRun(runId, null, 'failed', fullLog, String(err));
                return;
            }
        }

        // 2. Map data
        const mappedEventData = await mapEventWithLLM(rawEvents[0]);
        if (!mappedEventData) {
            log("❌ Failed to map event data");
            await completePipelineRun(runId, null, 'failed', fullLog, "LLM Mapping failed");
            return;
        }
        
        log("\n====== EXACT MAPPED JSON PAYLOAD EN ROUTE TO COHORT ======\n");
        log(JSON.stringify(mappedEventData, null, 2));
        log("\n==========================================================");

        const eventTitle = mappedEventData.title || "Unknown Event";
        let organizerNames = [];
        try {
            organizerNames = JSON.parse(mappedEventData._organizerNames || '[]');
        } catch(e) {}
        if (organizerNames.length === 0) organizerNames = ["Unknown Organizer"];
        
        const locationStr = mappedEventData.location || "";
        const primaryOrganizer = organizerNames[0];

        log(`\n--- AUTOMATED EMAIL EXTRACTION (GOOGLE + AI) ---`);
        log(`\n🔍 Hunting for email of Organizer: "${primaryOrganizer}"...`);
        let contactInfo = { emails: [] as string[], phones: [] as string[] };
        let googleBusinessLink = "";
        if (primaryOrganizer !== "Unknown Organizer") {
            contactInfo = await findEmailViaGoogleSearch(primaryOrganizer, locationStr);
            if (contactInfo.emails.length > 0) log(`Found Emails: ${contactInfo.emails.join(", ")}`);
            if (contactInfo.phones.length > 0) log(`Found Phones: ${contactInfo.phones.join(", ")}`);

            try {
                const axios = require("axios");
                const placesConfig = {
                    method: "post",
                    url: "https://google.serper.dev/places",
                    headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
                    data: JSON.stringify({ "q": primaryOrganizer, "gl": "in" })
                };
                const placesRes = await axios.request(placesConfig);
                if (placesRes.data && placesRes.data.places && placesRes.data.places.length > 0) {
                    const place = placesRes.data.places[0];
                    googleBusinessLink = place.link || (place.cid ? `https://maps.google.com/?cid=${place.cid}` : "");
                    log(`Found Google Maps Link: ${googleBusinessLink}`);
                }
            } catch (err: any) {
                log("Failed to fetch Google Maps Link from Serper: " + err.message);
            }
        } else {
            log(`Skipping email hunt because organizer is Unknown (likely not an event page).`);
        }

        // Combine date and time for PostgreSQL timestamp
        let fullStartTimestamp = mappedEventData.date;
        if (mappedEventData.startTime && mappedEventData.startTime.includes(':')) {
            const tz = mappedEventData.timezoneOffset || "+05:30";
            fullStartTimestamp = `${mappedEventData.date}T${mappedEventData.startTime}.000${tz}`;
        }

        // Determine if event is online
        const isOnline = mappedEventData.eventType === 'live' || mappedEventData.eventType === 'online' || locationStr.toLowerCase().includes('online');
        const finalLocation = mappedEventData.city && mappedEventData.city !== "Unknown" 
            ? mappedEventData.city 
            : (isOnline ? "Online" : (mappedEventData.otherLocationDetails ? `${locationStr}\n${mappedEventData.otherLocationDetails}` : locationStr));

        // Save to Pending Scrapes Queue
        const payload = {
            mappedEventData,
            targetUrl,
            organizerNames,
            locationStr,
            primaryOrganizer,
            contactInfo,
            fullStartTimestamp,
            finalLocation,
            eventTitle,
            googleBusinessLink
        };

        const { insertPendingScrape } = await import('./db');
        await insertPendingScrape(targetUrl, payload);

        log(`\n✅ Finished mapping: ${eventTitle} (Stored in Scraped Events Queue)`);
        await completePipelineRun(runId, null, 'success', fullLog);

    } catch (error: any) {
        log("❌ Pipeline failed: " + error.message);
        await completePipelineRun(runId, null, 'failed', fullLog, error.message);
    }
}

export async function approvePendingScrape(pendingId: string) {
    const { getPendingScrapeById, insertContact, insertEvent, upsertOrganization } = await import('./db');
    const row = await getPendingScrapeById(pendingId);
    if (!row) throw new Error("Pending scrape not found");

    const p = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    const {
        mappedEventData,
        targetUrl,
        primaryOrganizer,
        contactInfo,
        fullStartTimestamp,
        finalLocation,
        eventTitle
    } = p;

    // --- PRE-FLIGHT CHECK: PAID EVENTS ---
    // The Cohort API requires a configured vendor for paid events. If we try to push a paid event,
    // it will fail with a 422 Vendor not configured error. To save time and avoid bad states, 
    // we auto-reject it here.
    if (parseFloat(mappedEventData.price || "0") > 0 || mappedEventData.isPaid === "true") {
        console.log(`❌ Auto-rejecting scrape for: ${eventTitle}`);
        console.log(`Reason: Vendor not configured for this entity. Cannot create paid event.`);
        const { updatePendingScrapeStatus } = await import('./db');
        await updatePendingScrapeStatus(pendingId, 'rejected');
        return; // Return normally so the frontend refreshes and sees the 'rejected' status
    }

    console.log(`Approving scrape for: ${eventTitle}`);

    // --- 3. CREATE SUBCOMMUNITY FIRST ---
    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    const subcommunityId = await createSubcommunity(primaryOrganizer, contactInfo.emails[0] || "", contactInfo.phones[0] || "");
    
    if (subcommunityId) {
        const fetchedLink = await getAdminInviteLink(subcommunityId);
        if (fetchedLink) adminInviteLink = fetchedLink;

        const detailsData = await getSubcommunityDetails(subcommunityId);
        if (detailsData && detailsData.orgDetails) {
            const isPub = detailsData.orgDetails.isPublished;
            orgApprovalStatus = isPub ? 'published' : 'unpublished';
            if (detailsData.orgDetails.parentCommunity && detailsData.orgDetails.parentCommunity.name) {
                parentCommunityName = detailsData.orgDetails.parentCommunity.name;
            }
        }
    }

    // DB: Save organization
    const orgId = await upsertOrganization({
        name: primaryOrganizer,
        status: subcommunityId ? 'unclaimed' : 'failed',
        city: contactInfo.city || p.locationStr,
        address: contactInfo.address,
        website: contactInfo.website,
        membersCount: contactInfo.members_count,
        createdFor: "event", 
        owner: "hind admin", 
        communityName: parentCommunityName, 
        subcommunityId: subcommunityId || undefined,
        adminInviteLink: adminInviteLink !== "Not Generated" ? adminInviteLink : undefined,
        failureReason: subcommunityId ? undefined : 'API Error',
        hindStatus: orgApprovalStatus
    });

    // DB: Save contacts
    for (const email of contactInfo.emails) {
        await insertContact({ orgId, email, source: 'Google AI' });
    }
    for (const phone of contactInfo.phones) {
        await insertContact({ orgId, phone, source: 'Google AI' });
    }
    if (contactInfo.emails.length === 0 && contactInfo.phones.length === 0) {
        await insertContact({ orgId, source: 'System' }); 
    }

    // --- 4. PUSH EVENT TO COHORT ---
    let newEventId = "";
    let eventUrl = "";
    let approvalStatus = "pending";

    if (subcommunityId) {
        const apiResponse: any = await submitEventToCohortApi(mappedEventData, subcommunityId);
        const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
        newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
        eventUrl = `https://turbo.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/${subcommunityId}/events/${newEventId}`;

        if (newEventId) {
            const freshEventDetails = await getEventDetails(subcommunityId, newEventId);
            if (freshEventDetails && freshEventDetails.approvalStatus) {
                approvalStatus = freshEventDetails.approvalStatus === 'approved' ? 'published' : 'unpublished';
            }
        }
    }

    // DB: Save event
    await insertEvent({
        orgId,
        title: eventTitle,
        eventDate: fullStartTimestamp,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        location: finalLocation,
        hindUrl: eventUrl,
        sourceUrl: targetUrl,
        cohortEventId: newEventId,
        status: subcommunityId ? 'new' : 'failed',
        hindStatus: approvalStatus
    });

    // Remove from pending queue -> Now we just update the status to approved!
    const { updatePendingScrapeStatus } = await import('./db');
    await updatePendingScrapeStatus(pendingId, 'approved');
    console.log(`✅ Approved and pushed to Cohort successfully!`);
}
