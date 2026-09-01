const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldCode = `        log(\`\\n--- AUTOMATED EMAIL EXTRACTION (GOOGLE + AI) ---\`);
        log(\`\\n?? Hunting for email of Organizer: "\${primaryOrganizer}"...\`);
        let contactInfo = { emails: [] as string[], phones: [] as string[] };
        if (primaryOrganizer !== "Unknown Organizer") {
            contactInfo = await findEmailViaGoogleSearch(primaryOrganizer, locationStr);
            if (contactInfo.emails.length > 0) log(\`Found Emails: \${contactInfo.emails.join(", ")}\`);
            if (contactInfo.phones.length > 0) log(\`Found Phones: \${contactInfo.phones.join(", ")}\`);
        } else {
            log(\`Skipping email hunt because organizer is Unknown (likely not an event page).\`);
        }`;

const newCode = `        log(\`\\n--- AUTOMATED EMAIL EXTRACTION (GOOGLE + AI) ---\`);
        log(\`\\n?? Hunting for email and Google Maps link for Organizer: "\${primaryOrganizer}"...\`);
        let contactInfo = { emails: [] as string[], phones: [] as string[] };
        let googleBusinessLink = "";
        
        if (primaryOrganizer !== "Unknown Organizer") {
            contactInfo = await findEmailViaGoogleSearch(primaryOrganizer, locationStr);
            if (contactInfo.emails.length > 0) log(\`Found Emails: \${contactInfo.emails.join(", ")}\`);
            if (contactInfo.phones.length > 0) log(\`Found Phones: \${contactInfo.phones.join(", ")}\`);
            
            // QUICK SERPER PLACES CALL JUST FOR THE LINK
            try {
                const axios = require('axios');
                const placesConfig = {
                    method: 'post',
                    url: 'https://google.serper.dev/places',
                    headers: { 'X-API-KEY': process.env.SERPER_API_KEY, 'Content-Type': 'application/json' },
                    data: JSON.stringify({ "q": \`\${primaryOrganizer} \${locationStr}\`, "gl": "in" })
                };
                const placesRes = await axios.request(placesConfig);
                if (placesRes.data && placesRes.data.places && placesRes.data.places.length > 0) {
                    googleBusinessLink = placesRes.data.places[0].link || "";
                    log(\`Found Google Maps Link: \${googleBusinessLink}\`);
                }
            } catch (err: any) {
                log("Failed to fetch Google Maps Link from Serper: " + err.message);
            }
        } else {
            log(\`Skipping email hunt because organizer is Unknown (likely not an event page).\`);
        }`;

content = content.replace(oldCode, newCode);

const oldPayload = `        // Save to Pending Scrapes Queue
        const payload = {
            mappedEventData,
            targetUrl,
            organizerNames,
            locationStr,
            primaryOrganizer,
            contactInfo,
            fullStartTimestamp,
            finalLocation,
            eventTitle
        };`;

const newPayload = `        // Save to Pending Scrapes Queue
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
        };`;

content = content.replace(oldPayload, newPayload);
content = content.replace(oldPayload.replace(/\n/g, '\r\n'), newPayload.replace(/\n/g, '\r\n'));
content = content.replace(oldCode.replace(/\n/g, '\r\n'), newCode.replace(/\n/g, '\r\n'));

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Pipeline updated to fetch Google Maps link during initial scrape.");
