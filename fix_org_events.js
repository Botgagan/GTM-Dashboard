const fs = require('fs');
let dbTs = fs.readFileSync('backend/src/db.ts', 'utf-8');

const oldFunc = `export async function getOrgEvents(orgId: string, city?: string) {
    if (city) {
        const res = await pool.query(
            \`SELECT * FROM events WHERE org_id = $1 AND city ILIKE $2 ORDER BY created_at DESC\`,
            [orgId, \`%\${city}%\`]
        );`;

const newFunc = `export async function getOrgEvents(orgId: string, city?: string) {
    if (city) {
        const res = await pool.query(
            \`SELECT * FROM events WHERE org_id = $1 AND (city ILIKE $2 OR location ILIKE $2) ORDER BY created_at DESC\`,
            [orgId, \`%\${city}%\`]
        );`;

dbTs = dbTs.replace(oldFunc, newFunc);
fs.writeFileSync('backend/src/db.ts', dbTs);
console.log("Updated getOrgEvents");
