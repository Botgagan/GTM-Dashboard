const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

const oldReturn = `        // If they provided a Google Maps link, make sure we return it so the UI keeps it
        if (isGoogleMapsLink && !result.googleBusinessLink) {
            result.googleBusinessLink = providedUrl;
        }
        
        return result;`;

const newReturn = `        // If they provided a Google Maps link, make sure we return it so the UI keeps it
        if (isGoogleMapsLink && !result.googleBusinessLink) {
            result.googleBusinessLink = providedUrl;
        }

        // Use Brandfetch for the absolute best logo if a website was found
        if (result.websiteUrl) {
            try {
                // Extract just the domain (e.g., https://www.zoho.com/in -> zoho.com)
                const urlObj = new URL(result.websiteUrl);
                let domain = urlObj.hostname;
                if (domain.startsWith("www.")) {
                    domain = domain.substring(4);
                }
                
                // We just generate the Brandfetch CDN URL. 
                // The frontend <img src> will render it perfectly.
                const brandfetchUrl = \`https://cdn.brandfetch.io/\${domain}/w/400/h/400?c=1iddcr0aNs0Q29OXkyA\`;
                
                // Test if the image actually exists (Brandfetch returns 404 if not found)
                const logoTest = await axios.head(brandfetchUrl).catch(() => null);
                if (logoTest && logoTest.status === 200) {
                    result.logo = brandfetchUrl;
                    console.log("? Attached Brandfetch logo for domain:", domain);
                }
            } catch (err) {
                console.error("Failed to parse domain for Brandfetch:", err.message);
            }
        }
        
        return result;`;

content = content.replace(oldReturn, newReturn);
content = content.replace(oldReturn.replace(/\n/g, '\r\n'), newReturn.replace(/\n/g, '\r\n'));

fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
console.log("Brandfetch logo logic added.");
