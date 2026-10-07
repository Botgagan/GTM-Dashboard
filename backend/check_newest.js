const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkLatestScrape() {
  try {
    const res = await pool.query(`SELECT payload::jsonb->'mappedEventData'->>'startTime' as start, payload::jsonb->'mappedEventData'->>'endTime' as end, payload::jsonb->>'eventTitle' as title FROM pending_scrapes ORDER BY created_at DESC LIMIT 1`);
    console.log(res.rows[0]);
  } finally {
    pool.end();
  }
}
checkLatestScrape();
