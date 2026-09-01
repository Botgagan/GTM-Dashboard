const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldBlock = `        log(\`\\n--- AUTOMATED EMAIL EXTRACTION (GOOGLE + AI) ---\`);
        log(\`\\n???? Hunting for email of Organizer: "\${primaryOrganizer}"...\`);
        let contactInfo = { emails: [] as string[], phones: [] as string[] };
        if (primaryOrganizer !== "Unknown Organizer") {
            contactInfo = await findEmailViaGoogleSearch(primaryOrganizer, locationStr);
            if (contactInfo.emails.length > 0) log(\`Found Emails: \${contactInfo.emails.join(", ")}\`);
            if (contactInfo.phones.length > 0) log(\`Found Phones: \${contactInfo.phones.join(", ")}\`);
        } else {
            log(\`Skipping email hunt because organizer is Unknown (likely not an event page).\`);
        }`;

const newBlock = `        log(\`\\n--- AUTOMATED EMAIL EXTRACTION (GOOGLE + AI) ---\`);
        log(\`\\n???? Hunting for email and Google Maps link for Organizer: "\${primaryOrganizer}"...\`);
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
                    data: JSON.stringify({ "q": primaryOrganizer, "gl": "in" })
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

content = content.replace(oldBlock, newBlock);
content = content.replace(oldBlock.replace(/\n/g, '\r\n'), newBlock.replace(/\n/g, '\r\n'));

if (!content.includes('let googleBusinessLink = "";')) {
    console.log("Regex still failed. Using fallback replace.");
    content = content.replace('let contactInfo = { emails: [] as string[], phones: [] as string[] };', 'let contactInfo = { emails: [] as string[], phones: [] as string[] };\n        let googleBusinessLink = "";');
    content = content.replace('if (contactInfo.phones.length > 0) log(`Found Phones: ${contactInfo.phones.join(", ")}`);', 'if (contactInfo.phones.length > 0) log(`Found Phones: ${contactInfo.phones.join(", ")}`);\n\n            try {\n                const axios = require("axios");\n                const placesConfig = {\n                    method: "post",\n                    url: "https://google.serper.dev/places",\n                    headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },\n                    data: JSON.stringify({ "q": primaryOrganizer, "gl": "in" })\n                };\n                const placesRes = await axios.request(placesConfig);\n                if (placesRes.data && placesRes.data.places && placesRes.data.places.length > 0) {\n                    googleBusinessLink = placesRes.data.places[0].link || "";\n                    log(`Found Google Maps Link: ${googleBusinessLink}`);\n                }\n            } catch (err) {\n                log("Failed to fetch Google Maps Link from Serper: " + err.message);\n            }');
}

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Fixed pipeline scope error.");
