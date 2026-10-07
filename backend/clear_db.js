const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function clearData() {
  try {
    await pool.query(`TRUNCATE TABLE events, contacts, organizations, pipeline_runs, scraped_urls_history, pending_scrapes, organization_aliases CASCADE`);
    console.log("Successfully wiped all data!");
  } catch(e) {
    console.error("Failed:", e.message);
  } finally {
    pool.end();
  }
}
clearData();
