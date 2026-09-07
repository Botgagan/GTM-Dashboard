const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'hind_gtm',
  password: process.env.DB_PASSWORD || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function run() {
    const res = await pool.query("SELECT payload FROM pending_scrapes LIMIT 1;");
    console.log(res.rows[0].payload);
    process.exit(0);
}
run();
