const { pool } = require("./backend/dist/db.js");

async function check() {
    const res = await pool.query("SELECT COUNT(*) FROM pending_scrapes");
    console.log("Total pending_scrapes:", res.rows[0].count);
    
    const eventsRes = await pool.query("SELECT * FROM events WHERE source_url = 'https://allevents.in/online/bridge-usa-camp-counselor-at-vishram-international-services-ahmedabad-tickets/80002833686442'");
    console.log("Events match:", eventsRes.rows.length);
    process.exit(0);
}
check();
