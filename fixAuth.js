const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

const badVerify = `        // 2. Verify with Cohort API
        const axios = require('axios');
        try {
            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${cohortOrgId}\`);
            if (!verifyRes.data || !verifyRes.data.details || !verifyRes.data.details.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API" });
            }
        } catch(e) {
            return res.status(400).json({ error: "Failed to verify organization with Cohort API" });
        }`;

const goodVerify = `        // 2. Verify with Cohort API
        const axios = require('axios');
        try {
            const headers = { 'accept': 'application/json' };
            if (process.env.COHORT_ACCESS_TOKEN) {
                headers['Authorization'] = \`Bearer \${process.env.COHORT_ACCESS_TOKEN}\`;
            }
            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${cohortOrgId}\`, { headers });
            if (!verifyRes.data || !verifyRes.data.details || !verifyRes.data.details.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API" });
            }
        } catch(e: any) {
            console.error("Verification failed:", e.response?.data || e.message);
            return res.status(400).json({ error: "Failed to verify organization with Cohort API" });
        }`;

content = content.replace(badVerify, goodVerify);
fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Fixed server.ts verify API call headers");
