const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function run() {
  await pool.query('ALTER TABLE organizations ADD COLUMN IF NOT EXISTS rich_data JSONB;');
  
  // also add to schema.sql
  const fs = require('fs');
  const schemaPath = 'backend/db/schema.sql';
  if(fs.existsSync(schemaPath)) {
      let schema = fs.readFileSync(schemaPath, 'utf8');
      if(!schema.includes('rich_data JSONB')) {
          schema = schema.replace('failure_reason  TEXT,', 'failure_reason  TEXT,\n    rich_data       JSONB,');
          fs.writeFileSync(schemaPath, schema);
      }
  }
  
  console.log("Migration complete");
  process.exit(0);
}
run();
