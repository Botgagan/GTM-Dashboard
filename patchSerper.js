const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

const oldSerperCall = `        try {
            const config = {
                method: 'post',
                url: 'https://google.serper.dev/search',
                headers: { 
                    'X-API-KEY': SERPER_API_KEY, 
                    'Content-Type': 'application/json'
                },
                data: JSON.stringify({ "q": query, "gl": "in" })
            };

            const response = await axios.request(config);
            const searchResponse = response.data;`;

const newSerperCall = `        try {
            // 1. Get Google Places data specifically for the Google Maps Link
            const placesConfig = {
                method: 'post',
                url: 'https://google.serper.dev/places',
                headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
                data: JSON.stringify({ "q": query, "gl": "in" })
            };
            try {
                const placesRes = await axios.request(placesConfig);
                if (placesRes.data && placesRes.data.places && placesRes.data.places.length > 0) {
                    const place = placesRes.data.places[0];
                    snippets += \`\\nGOOGLE PLACES DATA:\\nTitle: \${place.title}\\nAddress: \${place.address}\\nPhone: \${place.phoneNumber}\\nWebsite: \${place.website}\\nGoogle Maps Link: \${place.link}\\n\`;
                }
            } catch (placesErr) {
                console.error("Serper Places API failed:", placesErr.message);
            }

            // 2. Get standard search for knowledge graph and organic website results
            const config = {
                method: 'post',
                url: 'https://google.serper.dev/search',
                headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
                data: JSON.stringify({ "q": query, "gl": "in" })
            };

            const response = await axios.request(config);
            const searchResponse = response.data;`;

content = content.replace(oldSerperCall, newSerperCall);
content = content.replace(oldSerperCall.replace(/\n/g, '\r\n'), newSerperCall.replace(/\n/g, '\r\n'));

fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
console.log("Serper Places API integration added.");
