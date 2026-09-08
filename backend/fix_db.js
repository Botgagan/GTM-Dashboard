const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/hind' });

async function fix() {
    try {
        const res = await pool.query("SELECT id, payload FROM pending_scrapes");
        for (let row of res.rows) {
            let p = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
            if (p.fullStartTimestamp && p.fullStartTimestamp.includes(':00:00')) {
                p.fullStartTimestamp = p.fullStartTimestamp.replace(':00:00', ':00');
                if (p.fullStartTimestamp.includes('-')) {
                    const parts = p.fullStartTimestamp.split('-');
                    const tz = '-' + parts.pop();
                    let base = parts.join('-');
                    if (base.split(':').length === 4) {
                        base = base.substring(0, base.lastIndexOf(':'));
                    }
                    p.fullStartTimestamp = base + '.000' + tz;
                }
                console.log("Fixed timestamp to:", p.fullStartTimestamp);
                await pool.query("UPDATE pending_scrapes SET payload = $1 WHERE id = $2", [JSON.stringify(p), row.id]);
            }
        }
        console.log("Finished fixing timestamps in DB");
    } catch(e) { console.error(e); }
    process.exit(0);
}
fix();
