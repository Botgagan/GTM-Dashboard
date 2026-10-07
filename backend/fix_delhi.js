const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function fixDelhi() {
  try {
    await pool.query(`UPDATE events SET city = 'Gandhinagar' WHERE title = 'EFY Expo Gujarat' AND city = 'New Delhi'`);
    console.log("Fixed EFY Expo");
  } finally {
    pool.end();
  }
}
fixDelhi();
