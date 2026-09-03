const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

const oldCheck = `            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${cohortOrgId}\`, { headers });
            if (!verifyRes.data || !verifyRes.data.details || !verifyRes.data.details.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API" });
            }`;

const newCheck = `            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${cohortOrgId}\`, { headers });
            
            console.log("Validation API Response:", JSON.stringify(verifyRes.data, null, 2));

            const responseData = verifyRes.data?.data || verifyRes.data;
            const orgDetails = responseData?.details || responseData;

            if (!orgDetails || !orgDetails.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API. Expected 'id', but got: " + JSON.stringify(responseData).substring(0, 100) });
            }`;

content = content.replace(oldCheck, newCheck);
fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Loosened validation check and added logging");
