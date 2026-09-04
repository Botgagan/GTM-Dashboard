const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

const anchor = `app.post('/api/pending-scrapes/:id/reject', async (req, res) => {`;

const newEndpoint = `app.post('/api/pending-scrapes/:id/link-org', async (req, res) => {
    try {
        const { orgId } = req.body;
        const { updatePendingScrapeLink } = await import('./db');
        await updatePendingScrapeLink(req.params.id, orgId || null);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});\n\napp.post('/api/pending-scrapes/:id/reject', async (req, res) => {`;

content = content.replace(anchor, newEndpoint);
fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Added /api/pending-scrapes/:id/link-org endpoint");
