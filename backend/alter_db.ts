import { pool } from './src/db';

async function run() {
    try {
        await pool.query(`ALTER TABLE scraped_urls_history ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'cron-job'`);
        console.log("Added source column");
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
