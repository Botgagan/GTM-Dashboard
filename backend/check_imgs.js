const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkScraped() {
  try {
    const res = await pool.query(`SELECT payload::jsonb->'images' as imgs FROM pending_scrapes LIMIT 3`);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    pool.end();
  }
}
checkScraped();
