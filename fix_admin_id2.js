const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf-8');

const regex = /    \/\/ Dynamically extract adminId from the JWT token[\s\S]*?console\.log\("Failed to extract Admin ID from JWT, using hardcoded fallback\."\);\s*\}/;
const replacement = `    // The Cohort API expects the Community Membership ID, NOT the User's dbId!
    // Using the ID provided by the user's admin list response.
    adminId = 'c32158f7-91ab-40a2-a0bc-504d9a4f96fd';`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('backend/src/apiClient.ts', content, 'utf-8');
    console.log("Updated apiClient.ts to use the exact Membership Admin ID.");
} else {
    console.log("Regex not found in apiClient.ts");
}
