const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkEvent() {
  try {
    const res = await pool.query(`SELECT title, city, location FROM events`);
    console.log(res.rows);
  } finally {
    pool.end();
  }
}
checkEvent();
