const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

// Replace the previous manual route with one that operates on organizations.id
const oldRoute = `app.post('/api/pending-scrapes/:id/retry-manual', async (req, res) => {
    try {
        const { manualUrl } = req.body;
        if (!manualUrl) return res.status(400).json({ error: "Missing manualUrl" });

        // Extract orgId from URL
        let orgId = "";
        try {
            const urlObj = new URL(manualUrl);
            orgId = urlObj.searchParams.get("orgId") || "";
        } catch(e) {
            return res.status(400).json({ error: "Invalid URL format" });
        }

        if (!orgId) return res.status(400).json({ error: "Could not find orgId in the URL" });

        // Verify with Cohort API
        const axios = require('axios');
        try {
            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${orgId}\`);
            if (!verifyRes.data || !verifyRes.data.details || !verifyRes.data.details.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API" });
            }
        } catch(e) {
            return res.status(400).json({ error: "Failed to verify organization with Cohort API" });
        }

        // Call the new pipeline function
        const { approveWithManualOrg } = require('./pipeline');
        await approveWithManualOrg(req.params.id, orgId);
        
        res.json({ success: true, orgId });
    } catch (e: any) { 
        res.status(500).json({ error: e.message }); 
    }
});`;

const newRoute = `app.post('/api/org/:id/retry-manual', async (req, res) => {
    try {
        const { manualUrl } = req.body;
        if (!manualUrl) return res.status(400).json({ error: "Missing manualUrl" });

        // 1. Extract Cohort orgId from URL
        let cohortOrgId = "";
        try {
            const urlObj = new URL(manualUrl);
            cohortOrgId = urlObj.searchParams.get("orgId") || "";
        } catch(e) {
            return res.status(400).json({ error: "Invalid URL format" });
        }
        if (!cohortOrgId) return res.status(400).json({ error: "Could not find orgId in the URL" });

        // 2. Verify with Cohort API
        const axios = require('axios');
        try {
            const verifyRes = await axios.get(\`https://devapi.cohort.social/organization/admin/details/\${cohortOrgId}\`);
            if (!verifyRes.data || !verifyRes.data.details || !verifyRes.data.details.id) {
                return res.status(400).json({ error: "Organization not found on Cohort API" });
            }
        } catch(e) {
            return res.status(400).json({ error: "Failed to verify organization with Cohort API" });
        }

        // 3. Call the pipeline function using the local organizations table ID
        const { retryManualOrg } = require('./pipeline');
        await retryManualOrg(req.params.id, cohortOrgId);
        
        res.json({ success: true, cohortOrgId });
    } catch (e: any) { 
        res.status(500).json({ error: e.message }); 
    }
});`;

content = content.replace(oldRoute, newRoute);
content = content.replace(oldRoute.replace(/\n/g, '\r\n'), newRoute.replace(/\n/g, '\r\n'));

fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Replaced manual retry route in server.ts");
