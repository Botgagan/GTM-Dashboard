const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkScraped2() {
  try {
    const res = await pool.query(`SELECT payload::jsonb->'mappedEventData'->'images' as imgs1, payload::jsonb->'mappedEventData'->'venueImage' as imgs2, payload::jsonb->'mappedEventData'->'cover' as imgs3 FROM pending_scrapes LIMIT 3`);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    pool.end();
  }
}
checkScraped2();
