const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const badFunc = `export async function getPendingScrapes(city?: string) {
    if (city) {
        const res = await pool.query(
            \`SELECT * FROM pending_scrapes 
             WHERE payload::jsonb -> 'mappedEventData' ->> 'location' ILIKE $1 
             ORDER BY created_at DESC\`,
            [\`%\${city}%\`]
        );
        return res.rows;
    } else {
        const res = await pool.query(\`SELECT * FROM pending_scrapes ORDER BY created_at DESC\`);
        return res.rows;
    }
}`;

const goodFunc = `export async function getPendingScrapes(city?: string) {
    const query = \`
        SELECT ps.*, o.name as linked_org_name, o.website as linked_org_website, o.subcommunity_id as linked_org_subcommunity_id, o.city as linked_org_city, o.created_at as linked_org_created_at 
        FROM pending_scrapes ps 
        LEFT JOIN organizations o ON ps.linked_org_id = o.id 
    \`;
    if (city) {
        const res = await pool.query(
            query + \` WHERE ps.payload::jsonb -> 'mappedEventData' ->> 'location' ILIKE $1 ORDER BY ps.created_at DESC\`,
            [\`%\${city}%\`]
        );
        return res.rows;
    } else {
        const res = await pool.query(query + \` ORDER BY ps.created_at DESC\`);
        return res.rows;
    }
}`;

content = content.replace(badFunc, goodFunc);
fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated getPendingScrapes to join linked org details");
