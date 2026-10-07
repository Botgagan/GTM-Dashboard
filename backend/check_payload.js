const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkFullPayload() {
  try {
    const res = await pool.query(`SELECT payload::jsonb->'mappedEventData' as mapped FROM pending_scrapes ORDER BY created_at DESC LIMIT 1`);
    console.log(JSON.stringify(res.rows[0].mapped, null, 2));
  } finally {
    pool.end();
  }
}
checkFullPayload();
