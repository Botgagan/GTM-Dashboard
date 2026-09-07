const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://gtm_user:gtm_password@localhost:5432/gtm_db' });

(async () => {
    const res = await pool.query("SELECT payload FROM pending_scrapes WHERE payload::jsonb -> 'mappedEventData' ->> 'title' IS NOT NULL LIMIT 1");
    console.log(JSON.stringify(res.rows[0].payload, null, 2));
    pool.end();
})();
