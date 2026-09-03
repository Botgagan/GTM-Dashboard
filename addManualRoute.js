const fs = require('fs');
let serverContent = fs.readFileSync('backend/src/server.ts', 'utf-8');

const routeStr = `
app.post('/api/pending-scrapes/:id/retry-manual', async (req, res) => {
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
});
`;

const insertPoint = `app.post('/api/pending-scrapes/:id/approve', async (req, res) => {`;
serverContent = serverContent.replace(insertPoint, routeStr + "\n" + insertPoint);

fs.writeFileSync('backend/src/server.ts', serverContent, 'utf-8');
console.log("Added /api/pending-scrapes/:id/retry-manual to server.ts");
