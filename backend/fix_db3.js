const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://gtm_user:gtm_password@localhost:5432/gtm_db' });

async function fix() {
    try {
        const res = await pool.query("SELECT id, payload FROM pending_scrapes");
        for (let row of res.rows) {
            let p = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
            if (p.fullStartTimestamp && p.fullStartTimestamp.includes('.000-')) {
                // e.g. 2026-09.000-22T19:00.000+05:30
                // We want: 2026-09-22T19:00.000+05:30
                p.fullStartTimestamp = p.fullStartTimestamp.replace('.000-', '-');
                console.log("Restored timestamp to:", p.fullStartTimestamp);
                await pool.query("UPDATE pending_scrapes SET payload = $1 WHERE id = $2", [JSON.stringify(p), row.id]);
            }
        }
        console.log("Finished restoring timestamps in DB");
    } catch(e) { console.error(e); }
    process.exit(0);
}
fix();
