const { pool } = require("./backend/dist/db.js");

async function setup() {
    try {
        console.log("Adding linked_org_id to pending_scrapes...");
        await pool.query(`ALTER TABLE pending_scrapes ADD COLUMN IF NOT EXISTS linked_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;`);
        
        console.log("Creating organization_aliases table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS organization_aliases (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
                alias_name VARCHAR(255) NOT NULL,
                platform VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(alias_name, platform)
            );
        `);
        console.log("Database schema successfully updated.");
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
setup();
