import { scrapeAllEvents } from "./apifyScraper";
import { mapEventWithLLM } from "./llmMapper";
import { findEmailViaGoogleSearch } from "./emailFinder";
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

        const db = await import('./db');
        let linkedOrgId = null;

        if (primaryOrganizer && primaryOrganizer !== "Unknown Organizer") {
            // STEP 1: Deterministic Alias Check
            linkedOrgId = await db.findLinkedOrgIdByAlias(primaryOrganizer);
            
            if (linkedOrgId) {
                log(`[Auto-Link] Found exact deterministic alias match for "${primaryOrganizer}"!`);
            } else {
                // STEP 2: Semantic LLM Resolution
                log(`[Auto-Link] No exact alias found. Asking LLM for semantic match...`);
                const existingOrgs = await db.getAllOrganizationsForLLM();
                if (existingOrgs.length > 0) {
                    const prompt = `
                    We scraped an event hosted by: "${primaryOrganizer}".
                    Here is a JSON list of existing organizations in our database:
                    ${JSON.stringify(existingOrgs)}
                    
                    Does "${primaryOrganizer}" strongly semantically match any of the existing organizations?
                    Respond with ONLY the exact UUID of the matched organization if you are highly confident (>95% sure it's the exact same entity).
                    If there is no match or you are unsure, respond with EXACTLY "none".
                    Do not explain. Just the UUID or "none".`;
                    
                    const { generateText } = await import('ai');
                    const { createOpenAI } = await import('@ai-sdk/openai');
                    const openrouter = createOpenAI({
                        baseURL: 'https://openrouter.ai/api/v1',
                        apiKey: process.env.OPENROUTER_API_KEY
                    });
                    try {
                        const { text } = await generateText({
                            model: openrouter('openai/gpt-4o-mini'),
                            prompt: prompt
                        });
                        const cleanText = text.trim();
                        if (cleanText.length > 10 && cleanText !== "none") {
                            linkedOrgId = cleanText;
                            log(`[Auto-Link] LLM confidently matched "${primaryOrganizer}" to Org ID: ${linkedOrgId}`);
                        } else {
                            log(`[Auto-Link] LLM determined no confident match.`);
                        }
                    } catch(e) {
                        log(`[Auto-Link] LLM semantic check failed: ` + e);
                    }
                }
            }
        }

        await db.insertPendingScrape(targetUrl, payload, linkedOrgId);

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

    // --- 3. SUBCOMMUNITY HANDLING (LINKED VS NEW) ---
    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    let subcommunityId = null;
    let orgId = null;

    if (row.linked_org_id) {
        console.log(`??? This event is pre-linked to Organization ID: ${row.linked_org_id}`);
        orgId = row.linked_org_id;
        
        // Fetch existing org to get subcommunity_id
        const { pool, insertOrganizationAlias } = await import('./db');
        const orgRes = await pool.query('SELECT subcommunity_id FROM organizations WHERE id = $1', [orgId]);
        if (orgRes.rows.length > 0 && orgRes.rows[0].subcommunity_id) {
            subcommunityId = orgRes.rows[0].subcommunity_id;
        }

        // Train the Alias dictionary! We know this mapping works now.
        if (primaryOrganizer && primaryOrganizer !== "Unknown Organizer") {
            await insertOrganizationAlias(orgId, primaryOrganizer, 'unknown');
        }

    } else {
        // Standard Flow: CREATE BRAND NEW SUBCOMMUNITY
        console.log(`??? No link found. Creating brand new subcommunity for ${primaryOrganizer}`);
        subcommunityId = await createSubcommunity(primaryOrganizer, contactInfo.emails[0] || "", contactInfo.phones[0] || "");
    }
    
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

    // DB: Save organization (ONLY IF NEW)
    if (!row.linked_org_id) {
        orgId = await upsertOrganization({
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
        hindStatus: orgApprovalStatus,
        richData: {
            logo: p.logo,
            images: p.images,
            accessibility: p.accessibility,
            offerings: p.offerings,
            amenities: p.amenities,
            payments: p.payments,
            description: p.mappedEventData?.description,
            googleBusinessLink: p.googleBusinessLink,
            facebook: contactInfo.facebook,
            instagram: contactInfo.instagram,
            youtube: contactInfo.youtube
        }
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
    
    // Train the AI on the new org creation
    if (primaryOrganizer && primaryOrganizer !== "Unknown Organizer") {
        const { insertOrganizationAlias } = await import('./db');
        await insertOrganizationAlias(orgId, primaryOrganizer, 'unknown');
    }
    }

    // --- 4. PUSH EVENT TO COHORT ---
    let newEventId = "";
    let eventUrl = "";
    let approvalStatus = "pending";

    if (subcommunityId) {
        const apiResponse: any = await submitEventToCohortApi(mappedEventData, subcommunityId);
        const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
        newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
        eventUrl = `${process.env.COHORT_FRONTEND_URL || "https://turbo.cohort.social"}/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/${subcommunityId}/events/${newEventId}`;

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
        startDate: mappedEventData.date,
        startTime: mappedEventData.startTime,
        endDate: mappedEventData.endDate && mappedEventData.endDate !== "2026-08-15" ? mappedEventData.endDate : undefined,
        endTime: mappedEventData.endTime,
        location: finalLocation,
        city: contactInfo.city || p.locationStr || mappedEventData.city,
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

export async function retryManualOrg(localOrgId: string, manualOrgId: string) {
    const { pool, updateOrganization } = await import('./db');
    
    // 1. Fetch the exact failed event for this org to guarantee we get the correct sourceUrl
    const failedEventRes = await pool.query("SELECT * FROM events WHERE org_id = $1 AND status = 'failed' LIMIT 1", [localOrgId]);
    if (failedEventRes.rows.length === 0) {
        throw new Error("Could not find the failed event record for this organization");
    }
    const failedEvent = failedEventRes.rows[0];
    const sourceUrl = failedEvent.source_url;

    // 2. Fetch the correct original payload using the sourceUrl
    const pendingRes = await pool.query("SELECT payload FROM pending_scrapes WHERE source_url = $1 LIMIT 1", [sourceUrl]);
    
    let p = null;
    let mappedEventData = null;
    if (pendingRes.rows.length > 0) {
        p = pendingRes.rows[0].payload;
        mappedEventData = p.mappedEventData || p;
    }
    
    // 3. Get fresh details from Cohort GET API to overwrite our local data
    const apiClient = await import('./apiClient');
    let apiData = null;
    try {
        apiData = await apiClient.getSubcommunityDetails(manualOrgId);
    } catch (e) {
        console.error("Warning: Failed to fetch fresh details from Cohort API", e);
    }

    // Use existing DB name as fallback if payload is missing
    const orgRes = await pool.query('SELECT name, city FROM organizations WHERE id = $1', [localOrgId]);
    
    let updatedName = p ? p.primaryOrganizer : orgRes.rows[0].name;
    let updatedWebsite = null;
    let updatedCity = p ? p.locationStr : orgRes.rows[0].city;
    let updatedAddress = p ? p.locationStr : orgRes.rows[0].city;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;
    let updatedCommunityName = null;
    
    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        if (orgDetails.location) updatedCity = orgDetails.location;
        if (orgDetails.address || orgDetails.location) updatedAddress = orgDetails.address || orgDetails.location;
        if (orgDetails.isPublished) updatedHindStatus = 'published';
        if (apiData.members) updatedMembersCount = parseInt(apiData.members) || 0;
        if (orgDetails.parentCommunity && orgDetails.parentCommunity.name) {
            updatedCommunityName = orgDetails.parentCommunity.name;
        }
        
        // Handle Contacts (email/phone) mapping
        const email = orgDetails.email;
        const phone = orgDetails.phoneNo;
        
        if (email && email.indexOf('@placeholder.com') === -1) {
            await pool.query("INSERT INTO contacts (org_id, email, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, email]);
        }
        if (phone) {
            await pool.query("INSERT INTO contacts (org_id, phone, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, phone]);
        }
    }

    // 4. Update the organization in our local DB safely!
    // We explicitly avoid updateOrganization() here because it is a "full replace" function
    // that accidentally nullifies missing fields like rich_data and address.
    await pool.query(`
        UPDATE organizations 
        SET 
            subcommunity_id = $1,
            name = COALESCE($2, name),
            org_name = COALESCE($3, org_name),
            website = COALESCE($4, website),
            hind_status = $5,
            community_name = COALESCE($6, community_name),
            created_for = 'event',
            owner = 'hind admin',
            failure_reason = NULL,
            status = 'unclaimed',
            updated_at = NOW()
        WHERE id = $7
    `, [manualOrgId, updatedName, updatedName, updatedWebsite, updatedHindStatus, updatedCommunityName, localOrgId]);

    if (updatedMembersCount > 0) {
        await pool.query('UPDATE organizations SET members_count = $1 WHERE id = $2', [updatedMembersCount, localOrgId]);
    }

    // 5. Submit Event to Cohort API (ONLY IF PAYLOAD EXISTS)
    if (mappedEventData) {
        let newEventId = "";
        let eventUrl = "";
        let approvalStatus = "pending";

        const apiResponse: any = await apiClient.submitEventToCohortApi(mappedEventData, manualOrgId);
        const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
        newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
        eventUrl = `${process.env.COHORT_FRONTEND_URL || "https://turbo.cohort.social"}/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/${manualOrgId}/events/${newEventId}`;

        if (newEventId) {
            const freshEventDetails = await apiClient.getEventDetails(manualOrgId, newEventId);
            if (freshEventDetails && freshEventDetails.approvalStatus) {
                approvalStatus = freshEventDetails.approvalStatus === 'approved' ? 'published' : 'unpublished';
            }
        }

        // 6. UPDATE the existing failed event instead of inserting a duplicate!
        await pool.query(
            "UPDATE events SET status = $1, cohort_event_id = $2, hind_url = $3, hind_status = $4 WHERE id = $5",
            ['new', newEventId, eventUrl, approvalStatus, failedEvent.id]
        );
    } else {
        console.log("Skipping event push because original payload was deleted from pending_scrapes.");
    }

    // 7. Generate Admin Invite Link
    try {
        const adminInviteLink = await apiClient.getAdminInviteLink(manualOrgId);
        if (adminInviteLink && adminInviteLink !== "Not Generated") {
            await pool.query("UPDATE organizations SET admin_invite_link = $1 WHERE id = $2", [adminInviteLink, localOrgId]);
        }
    } catch(e) { console.error("Failed to fetch admin link on manual retry"); }

    console.log(`??? Manual Organization Link Successful!`);
}

