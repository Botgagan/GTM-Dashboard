const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkPending() {
  try {
    const res = await pool.query(`SELECT count(*) as c FROM pending_scrapes`);
    console.log("Count:", res.rows[0].c);
  } finally {
    pool.end();
  }
}
checkPending();
