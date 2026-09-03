const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const badIfBlock = `    if (apiData && apiData.details) {
        if (apiData.details.name) updatedName = apiData.details.name;
        if (apiData.details.website) updatedWebsite = apiData.details.website;
        // Map location if available, otherwise keep scraped city
        if (apiData.details.location) updatedCity = apiData.details.location;
        
        // Handle Contacts (email/phone) mapping
        const email = apiData.details.email;
        const phone = apiData.details.phoneNo;`;

const goodIfBlock = `    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        // Map location if available, otherwise keep scraped city
        if (orgDetails.location) updatedCity = orgDetails.location;
        
        // Handle Contacts (email/phone) mapping
        const email = orgDetails.email;
        const phone = orgDetails.phoneNo;`;

content = content.replace(badIfBlock, goodIfBlock);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Fixed API data mapping path");
