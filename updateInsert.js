const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const badFunc = `export async function insertPendingScrape(sourceUrl: string, payload: any) {
    const res = await pool.query(
        \`INSERT INTO pending_scrapes (source_url, payload, status) VALUES ($1, $2, 'pending') RETURNING id\`,
        [sourceUrl, JSON.stringify(payload)]
    );
    return res.rows[0].id;
}`;

const goodFunc = `export async function insertPendingScrape(sourceUrl: string, payload: any, linkedOrgId: string | null = null) {
    const res = await pool.query(
        \`INSERT INTO pending_scrapes (source_url, payload, status, linked_org_id) VALUES ($1, $2, 'pending', $3) RETURNING id\`,
        [sourceUrl, JSON.stringify(payload), linkedOrgId]
    );
    return res.rows[0].id;
}`;

content = content.replace(badFunc, goodFunc);
fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated insertPendingScrape signature");
