const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/hind_gtm_dev' });
pool.query(`SELECT DISTINCT location FROM events WHERE location ILIKE '%All%'`).then(res => {
    console.log(res.rows);
    process.exit(0);
});
