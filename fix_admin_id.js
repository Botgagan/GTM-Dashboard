const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf-8');

const regex = /let adminId = 'df0e077b-a203-48a3-acc1-41da79656543';/;
const replacement = `    let adminId = 'df0e077b-a203-48a3-acc1-41da79656543';
    
    // Dynamically extract adminId from the JWT token
    try {
        const token = process.env.COHORT_API_TOKEN || process.env.COHORT_ACCESS_TOKEN;
        if (token) {
            const payloadB64 = token.split('.')[1];
            const decoded = JSON.parse(Buffer.from(payloadB64, 'base64').toString('utf-8'));
            if (decoded.dbId) adminId = decoded.dbId;
            else if (decoded.sub) adminId = decoded.sub;
            console.log("Dynamically extracted Admin ID from JWT:", adminId);
        }
    } catch(e) {
        console.log("Failed to extract Admin ID from JWT, using hardcoded fallback.");
    }`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('backend/src/apiClient.ts', content, 'utf-8');
    console.log("Updated apiClient.ts to dynamically extract adminId from JWT");
} else {
    console.log("Regex not found in apiClient.ts");
}
