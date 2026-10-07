const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkEventbriteUrl() {
  try {
    const res = await pool.query(`SELECT source_url FROM pending_scrapes ORDER BY created_at DESC LIMIT 1`);
    console.log(res.rows[0].source_url);
  } finally {
    pool.end();
  }
}
checkEventbriteUrl();
