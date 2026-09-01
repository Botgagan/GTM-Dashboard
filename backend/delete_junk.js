"use strict";
const { pool } = require('./src/db');
async function run() {
    console.log("Cleaning up junk URLs...");
    try {
        await pool.query(`DELETE FROM pending_scrapes WHERE source_url LIKE '%/blog/%' OR source_url LIKE '%/blogs/%' OR source_url LIKE '%/anchorage/%' OR source_url LIKE '%localhost%' OR source_url LIKE '%navratri-2026%' OR source_url LIKE '%7-best-labor-day%'`);
        console.log("Deleted junk pending scrapes.");
        await pool.query(`DELETE FROM pipeline_runs WHERE status = 'failed' OR log ILIKE '%Unknown Organizer%'`);
        console.log("Deleted failed pipeline runs.");
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await pool.end();
    }
}
run();
