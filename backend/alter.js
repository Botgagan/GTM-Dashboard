const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://gtm_user:gtm_password@localhost:5432/gtm_db' });

(async () => {
    try {
        await pool.query('ALTER TABLE events ADD COLUMN city TEXT');
        console.log("Added city column to events table");
    } catch(e) {
        console.log(e.message);
    }
    pool.end();
})();
