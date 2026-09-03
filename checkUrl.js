const { pool } = require("./backend/dist/db.js");

async function check() {
    const res = await pool.query("SELECT id, source_url, status FROM pending_scrapes WHERE source_url ILIKE '%vishram-international-services-ahmedabad-tickets%'");
    console.log(res.rows);
    process.exit(0);
}
check();
