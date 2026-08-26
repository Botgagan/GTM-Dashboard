import { PlatformHandler } from "./router";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import { HindEventPayload } from "../types";

dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "",
});

export const getGenericPageFunction = () => `async ({ page, request, log }) => {
    // Wait a few seconds to ensure all dynamic components render
    await page.waitForTimeout(3000);
    
    // Extract both the hidden JSON-LD structured data and the visible DOM text
    const extractedData = await page.evaluate(() => {
        let eventData = null;
        let rawJsonLds = [];
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        scripts.forEach((el) => {
            rawJsonLds.push(el.innerHTML);
            try {
                const data = JSON.parse(el.innerHTML);
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                    if (item['@type'] === 'Event' || item['@type'] === 'SportsEvent' || item.organizer) {
                        eventData = item;
                    }
                }
            } catch (e) {}
        });
        
        const nextData = document.getElementById('__NEXT_DATA__');
        if (nextData) {
            rawJsonLds.push(nextData.innerHTML);
        }
        
        // Remove unnecessary nav elements to keep text clean
        const navs = document.querySelectorAll('nav, header, footer');
        navs.forEach(n => n.remove());
        
        // Extract both the hidden JSON-LD structured data and the visible DOM text
        const ogTitle = document.querySelector('meta[property="og:title"]');
        const title = ogTitle ? ogTitle.content : document.title;
        
        const ogImage = document.querySelector('meta[property="og:image"]');
        let imageUrl = ogImage ? ogImage.content : null;
        
        // Fallback for image if no OG tag exists
        if (!imageUrl) {
            const imgEl = document.querySelector('img');
            imageUrl = imgEl ? imgEl.src : null;
        }

        // Extract the full description generically from meta tags if available, else from DOM
        const ogDesc = document.querySelector('meta[property="og:description"]');
        const eventContent = ogDesc ? ogDesc.content : '';
        
        // Extract full page text for LLM inference
        const fullPageText = document.body.innerText.substring(0, 8000);
        
        // Deterministically check for comments UI
        const bodyLower = document.body.innerText.toLowerCase();
        const hasComments = bodyLower.includes("post comment") || 
                            bodyLower.includes("what's your take") || 
                            bodyLower.includes("write a comment");
        
        return {
            url: window.location.href,
            jsonLd: eventData,
            rawJsonLds: rawJsonLds,
            eventContent: eventContent,
            fullPageText: fullPageText,
            hasComments: hasComments,
            title: title,
            imageUrl: imageUrl
        };
    });
    
    extractedData.requestedUrl = request.url;
    return extractedData;
}`;

export const genericMapEvent = async (scrapedEvent: any): Promise<HindEventPayload | null> => {
    const dummyUuid = uuidv4();
    const ld = scrapedEvent.jsonLd || {};
    
    // --- 1. DETERMINISTIC PARSING ---
    let date = "2026-08-15";
    let endDate = "2026-08-15";
    let startTime = "06:00:00Z";
    
    // Attempt fallback Regex extraction for broken JSON-LD tags
    const rawHtml = (scrapedEvent.rawJsonLds || []).join(" ") + (JSON.stringify(scrapedEvent) || "");
    const startDateMatch = rawHtml.match(/"startDate"\s*:\s*"([^"]+)"/i);
    const endDateMatch = rawHtml.match(/"endDate"\s*:\s*"([^"]+)"/i);
    
    let extractedStartDate = ld.startDate || (startDateMatch ? startDateMatch[1] : null);
    let extractedEndDate = ld.endDate || (endDateMatch ? endDateMatch[1] : null);

    // Hardcoded logic for District.in to bypass LLM confusion with ticket phase dates
    const districtDateMatch = rawHtml.match(/date_string(?:_v2)?\\*["']?\\*\s*:\s*\\*["']?([^"'\\]+)/i);
    if (districtDateMatch) {
        let dString = districtDateMatch[1]; // e.g. "11 Oct - 20 Oct, 9 PM onwards" or "Sun, 11 Oct - Tue, 20 Oct, 9:00 PM"
        
        // Remove 'Sun, ' or 'Tue, ' completely so that we only have the dates to process
        dString = dString.replace(/[A-Za-z]+,\s/g, ''); 
        dString = dString.replace(/\\u2013/g, '-');
        
        const isMultiDay = dString.includes('-') || dString.includes('–');
        const currentYear = new Date().getFullYear();
        if (isMultiDay) {
            const parts = dString.split(/[-–]/);
            const startPart = parts[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
            const endPart = parts[1].split(',')[0].replace(/[^a-zA-Z0-9\s]/g, '').trim();
            extractedStartDate = `${startPart} ${currentYear}`;
            extractedEndDate = `${endPart} ${currentYear}`;
            
            const timeMatch = parts[1].match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
            if (timeMatch) extractedStartDate += ` ${timeMatch[1]}`;
        } else {
            extractedStartDate = `${dString.split(',')[0]} ${currentYear}`;
            const timeMatch = dString.match(/(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i);
            if (timeMatch) extractedStartDate += ` ${timeMatch[1]}`;
        }
    }

    if (extractedStartDate) {
        try {
            const startUtc = new Date(extractedStartDate);
            if (!isNaN(startUtc.getTime())) {
                date = startUtc.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
                startTime = startUtc.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            }
        } catch(e) {}
    }
    
    if (extractedEndDate) {
        const endSplit = extractedEndDate.split('T');
        endDate = endSplit[0];
    }
    
    const dateObj = date ? new Date(date) : null;
    const month = dateObj ? dateObj.toLocaleString('en-US', { month: 'long' }) : "string";
    const daysOfWeek = dateObj ? dateObj.toLocaleString('en-US', { weekday: 'long' }) : "string";
    
    let day = "string";
    if (dateObj) {
        const startDay = dateObj.getDate();
        const monthYear = dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        if (ld.endDate) {
            const endObj = new Date(ld.endDate);
            const endDay = endObj.getDate();
            if (startDay !== endDay && endObj.getMonth() === dateObj.getMonth()) {
                day = `${startDay}-${endDay} ${monthYear}`;
            } else {
                day = `${startDay} ${monthYear}`;
            }
        } else {
            day = `${startDay} ${monthYear}`;
        }
    }

    let latitude: any = 0;
    let longitude: any = 0;
    let locationName = "";
    let locationAddress = "";
    if (ld.location) {
        if (ld.location.name) locationName = ld.location.name;
        if (ld.location.address) {
            if (typeof ld.location.address === 'string') locationAddress = ld.location.address;
            else if (ld.location.address.streetAddress) {
                const parts = [ld.location.address.streetAddress, ld.location.address.addressLocality].filter(Boolean);
                locationAddress = parts.join(', ');
            } else if (ld.location.address.addressLocality) {
                locationAddress = ld.location.address.addressLocality;
            }
        }
        if (ld.location.geo) {
            latitude = ld.location.geo.latitude || 0;
            longitude = ld.location.geo.longitude || 0;
        }
    }

    let organizerNames: string[] = [];
    if (ld.organizer && Array.isArray(ld.organizer)) {
        organizerNames = ld.organizer.map((o: any) => o.name).filter(Boolean);
    } else if (ld.organizer && ld.organizer.name) {
        organizerNames = [ld.organizer.name];
    }
    
    // Reject platform domains as organizer names
    const blacklistedOrganizers = ["Wowsly", "Townscript", "MeraEvents", "AllEvents", "SortMyScene", "Eventbrite"];
    organizerNames = organizerNames.filter(name => !blacklistedOrganizers.some(b => name.toLowerCase().includes(b.toLowerCase())));

    let lowestPrice = "0";
    let ticketVariants: any[] = [];
    if (ld.offers) {
        const offersArray = Array.isArray(ld.offers) ? ld.offers : [ld.offers];
        offersArray.forEach((offer: any) => {
            if (offer.price && offer.name) {
                ticketVariants.push({
                    name: offer.name,
                    description: "Standard Entry",
                    price: offer.price,
                    quantity: 100,
                    maxTicketPerUser: 10,
                    ticketType: "single_ticket"
                });
            } else if (offer.lowPrice) {
                lowestPrice = String(offer.lowPrice);
            } else if (offer.price) {
                lowestPrice = String(offer.price);
            }
        });
    }

    let title = ld.name || scrapedEvent.title || "Untitled Event";
    const imageUrl = ld.image || scrapedEvent.imageUrl || "string";
    const description = ld.description || scrapedEvent.eventContent || "No description provided.";
    
    // --- 2. LLM INFERENCE ---
    console.log("Asking GPT-4o-mini to infer missing amenities, refund policies, and comments...");
    let venueAmenities = "";
    let refundPolicy = "No Refunds";
    let commentAllow = scrapedEvent.hasComments ? "true" : "false";
    let duration = "270"; 
    let frequency = "day";
    let daysOfWeekStr = daysOfWeek;
    let eventType = "offline";
    let aiTitle = title;
    let aiStartDate = "";
    let aiEndDate = "";
    let aiEndTime = "";
    let timezoneOffset = "+05:30";
    
    try {
        const prompt = `Read this event description and full page text carefully.
        Title: ${title}
        Event Description: ${description}
        Full Page Text Snippet (For finding buttons/footers):
        ${scrapedEvent.fullPageText || ""}
        Location Name: ${locationName}
        
        Extract these specific details and return ONLY a raw JSON object (no markdown).
        1. venueAmenities: Infer any amenities like parking, food, AC from the description. If none, write "".
        2. refundPolicy: Read the Full Page Text to infer the refund policy (e.g. "Tickets are non-cancelable"). If not mentioned, write "No Refunds".
        3. price: Extract the numeric ticket price found on the page (e.g. "499"). Look for currency symbols or words like "From ₹284". If it's free or not found, write "0".
        4. durationMinutes: Calculate duration in minutes between the start and end times in the text. If the event spans multiple days, calculate total minutes. If an end time is NOT explicitly given, fallback to "270".
        5. startTime: Extract the exact start time written on the page and convert to 24-hour LOCAL format (e.g. 6:00 PM -> "18:00:00", 10:00 AM -> "10:00:00"). CRITICAL: DO NOT subtract 5.5 hours! DO NOT perform any UTC conversions! If not found, write "00:00:00".
        6. endTime: Extract the exact end time written on the page and convert to 24-hour LOCAL format (e.g. 11:00 PM -> "23:00:00"). CRITICAL: DO NOT perform UTC conversions! If not found, leave empty "".
        7. latitude: Guess the GPS latitude for the "Location Name" provided. If you don't know, write 0.
        8. longitude: Guess the GPS longitude for the "Location Name" provided. If you don't know, write 0.
        9. frequency: Read the dates. If the event happens every week on a specific day (like "Every Saturday" or "15 Aug, 22 Aug, 29 Aug" which are 7 days apart), write "week". If it happens every single day, write "day". If it's a one-off, write "none".
        10. daysOfWeek: If frequency is "week", write the day of the week (e.g. "Saturday").
        11. eventType: Read the text to determine if it is an online virtual event or an in-person event. If it is in-person at a physical venue, return "offline". If it is an online webinar/stream, return "live". Default to "offline".
        12. organizerNames: Extract the names of the primary people, companies, or brands organizing, presenting, or co-hosting the event. If multiple entities are listed as presenting or organizing the event (e.g. 'Dream Deviser and Mukesh Hardware present'), extract ALL of them as an array of strings. CRITICAL: DO NOT include photography agencies, radio partners, or venue owners. If completely unknown, return [].
        13. startDate: Extract the OVERALL starting date of the actual event in YYYY-MM-DD format (e.g., "2026-08-29"). CRITICAL: Look for main event dates (e.g. "Sun, 11 Oct"). DO NOT extract the date a ticket phase starts or becomes available. If the year is not mentioned, assume "2026".
        14. endDate: Extract the OVERALL ending date of the actual event in YYYY-MM-DD format (e.g., "2026-08-31"). CRITICAL: DO NOT extract ticket phase ending dates. If the year is not mentioned, assume "2026". If no end date is mentioned, use the startDate.
        15. cleanTitle: Clean up the provided Title by removing any website suffixes (e.g. "| MeraEvents" or "- Eventbrite").
        16. timezoneOffset: Extract the timezone offset from the page if mentioned (e.g., if PST/PDT write "-07:00", if EST/EDT write "-04:00", if UTC write "+00:00"). If no timezone is mentioned, assume IST and write "+05:30".
        
        Example Output:
        {"venueAmenities": "Parking, Food", "refundPolicy": "Tickets are non-cancelable", "price": "284", "durationMinutes": "270", "startTime": "14:30:00", "endTime": "23:00:00", "latitude": 23.0225, "longitude": 72.5714, "frequency": "week", "daysOfWeek": "Saturday", "eventType": "offline", "organizerNames": ["Dream Deviser", "Mukesh Hardware"], "startDate": "2026-08-29", "endDate": "2026-08-31", "cleanTitle": "The Final Draft", "timezoneOffset": "+05:30"};`;

        const response = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
        });
        
        const resultText = response.choices[0].message?.content?.trim();
        if (resultText) {
            const aiData = JSON.parse(resultText.replace(/^\`\`\`json/m, '').replace(/^\`\`\`/m, '').trim());
            if (aiData.venueAmenities) venueAmenities = aiData.venueAmenities;
            if (aiData.refundPolicy) refundPolicy = aiData.refundPolicy;
            if (aiData.durationMinutes) duration = aiData.durationMinutes;
            if (aiData.startTime && startTime === "06:00:00Z") startTime = aiData.startTime;
            if (aiData.endTime) aiEndTime = aiData.endTime;
            if (aiData.latitude) latitude = aiData.latitude;
            if (aiData.longitude) longitude = aiData.longitude;
            if (aiData.price && aiData.price !== "0") lowestPrice = String(aiData.price).replace(/[^0-9.]/g, ''); 
            if (aiData.frequency) frequency = aiData.frequency;
            if (aiData.daysOfWeek) daysOfWeekStr = aiData.daysOfWeek;
            if (aiData.eventType) eventType = aiData.eventType;
            if (aiData.organizerNames && Array.isArray(aiData.organizerNames)) {
                const aiOrgs = aiData.organizerNames.filter((n: string) => !blacklistedOrganizers.some(b => n.toLowerCase().includes(b.toLowerCase())));
                organizerNames = Array.from(new Set([...organizerNames, ...aiOrgs]));
            }
            if (aiData.startDate) aiStartDate = aiData.startDate;
            if (aiData.endDate) aiEndDate = aiData.endDate;
            if (aiData.cleanTitle) aiTitle = aiData.cleanTitle;
            if (aiData.timezoneOffset) timezoneOffset = aiData.timezoneOffset;
        }
        
        if (date === "2026-08-15" && aiStartDate) date = aiStartDate;
        if (endDate === "2026-08-15" && aiEndDate) endDate = aiEndDate;
        if (aiTitle) title = aiTitle;
        
        let cleanPriceStr = String(lowestPrice).replace(/[^0-9.]/g, '');
        if (!cleanPriceStr) cleanPriceStr = "0";
        lowestPrice = cleanPriceStr;
        
        if (lowestPrice !== "0" && ticketVariants.length === 0) {
            ticketVariants.push({
                name: "General Admission",
                description: "Standard Entry",
                price: Number(lowestPrice),
                quantity: 100,
                maxTicketPerUser: 10,
                ticketType: "single_ticket"
            });
        }
        
    } catch (e) {
        console.error("LLM Inference failed, using defaults", e);
    }

    const zones = [[{
        name: "General",
        zoneType: "sitting",
        tickets: ticketVariants
    }]];

    let finalDaysOfWeek = "[]";
    if (daysOfWeekStr && daysOfWeekStr !== "string" && daysOfWeekStr !== "") {
        if (daysOfWeekStr.startsWith('[')) {
            finalDaysOfWeek = daysOfWeekStr.toLowerCase();
        } else {
            finalDaysOfWeek = `["${daysOfWeekStr.toLowerCase()}"]`;
        }
    }
    
    // Recompute day and month using the potentially updated date and endDate
    const finalDateObj = date && date !== "string" ? new Date(date) : null;
    let finalMonth = "string";
    let finalDay = "string";
    
    if (finalDateObj) {
        finalMonth = finalDateObj.toLocaleString('en-US', { month: 'long' });
        const startDay = finalDateObj.getDate();
        const monthYear = finalDateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        if (endDate && endDate !== "string") {
            const endObj = new Date(endDate);
            const endDay = endObj.getDate();
            if (startDay !== endDay && endObj.getMonth() === finalDateObj.getMonth()) {
                finalDay = `${startDay}-${endDay} ${monthYear}`;
            } else {
                finalDay = `${startDay} ${monthYear}`;
            }
        } else {
            finalDay = `${startDay} ${monthYear}`;
        }
    }

    return {
        languageIds: dummyUuid,
        libraryVideo: dummyUuid,
        month: finalMonth,
        gstType: "inclusive",
        daysOfWeek: finalDaysOfWeek,
        youtube: "true",
        interval: "string",
        recordingInLibrary: "true",
        facebook: "true",
        zones: JSON.stringify(zones),
        donationsAllow: "true",
        venueAmenities: venueAmenities,
        price: lowestPrice,
        endDate: endDate,
        mentions: JSON.stringify([]),
        commentAllow: commentAllow,
        refundPolicy: refundPolicy,
        hosts: dummyUuid,
        venueImage: imageUrl,
        latitude: latitude,
        youtubeUrl: "string",
        moderators: dummyUuid,
        webLink: scrapedEvent.url || "string",
        date: date,
        eventTypeId: dummyUuid,
        longitude: longitude,
        startTime: startTime,
        totalTicket: "100",
        guestAllow: "true",
        maxTicketPurchase: "10",
        visibility: "string",
        isRecurring: "true",
        streamAllOccurenece: "true",
        endsAfterOccurence: "string",
        eventType: eventType,
        duration: duration,
        videoLink: "string",
        payRecurring: "true",
        location: locationName,
        keepSellingTicket: "true",
        title: title,
        images: imageUrl,
        externalLiveUrl: "string",
        keepSellingTicketMins: "string",
        tags: dummyUuid,
        timeZone: "string",
        ticketVariants: JSON.stringify(ticketVariants),
        schedules: JSON.stringify([{
            date: date,
            startTimes: [startTime]
        }]),
        frequency: frequency,
        day: finalDay,
        description: description.substring(0, 1000),
        sacCodeId: dummyUuid,
        otherLocationDetails: locationAddress,
        repeatFirstTelecast: "true",
        eventContent: scrapedEvent.eventContent || description,
        _organizerNames: JSON.stringify(organizerNames.length > 0 ? organizerNames : ["Unknown Organizer"]),
        timezoneOffset: timezoneOffset,
        endTime: aiEndTime
    };
};
