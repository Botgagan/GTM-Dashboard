"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./src/db");
async function run() {
    try {
        await db_1.pool.query(`ALTER TABLE scraped_urls_history ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'cron-job'`);
        console.log("Added source column");
    }
    catch (e) {
        console.error(e);
    }
    finally {
        await db_1.pool.end();
    }
}
run();
