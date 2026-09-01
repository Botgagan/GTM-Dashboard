const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

const importStatement = `import { fetchGoogleBusinessDetails } from './googleBusinessFetcher';\n`;
if (!content.includes('fetchGoogleBusinessDetails')) {
    content = importStatement + content;
}

const route = `
app.post('/api/sync-google-business', async (req, res) => {
    try {
        const { orgName, googleBusinessLink } = req.body;
        if (!orgName) {
            res.status(400).json({ error: 'orgName is required' });
            return;
        }
        
        const data = await fetchGoogleBusinessDetails(orgName, googleBusinessLink);
        res.json(data);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

`;

content = content.replace('app.listen(PORT, () => {', route + 'app.listen(PORT, () => {');

fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Route injected into server.ts");
