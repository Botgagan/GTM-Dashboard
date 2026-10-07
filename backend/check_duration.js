const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkDuration() {
  try {
    const res = await pool.query(`SELECT payload::jsonb->'mappedEventData'->>'durationMinutes' as duration FROM pending_scrapes ORDER BY created_at DESC LIMIT 1`);
    console.log("Duration:", res.rows[0].duration);
  } finally {
    pool.end();
  }
}
checkDuration();
