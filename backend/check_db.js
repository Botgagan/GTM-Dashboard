const { Pool } = require('pg');
const pool = new Pool({
  user: 'gtm_user',
  host: 'localhost',
  database: 'gtm_db',
  password: 'gtm_password',
  port: 5432,
});

async function checkEvents() {
  try {
    const res = await pool.query(`SELECT id, payload::jsonb->>'locationStr' as loc_str, payload::jsonb->'contactInfo'->>'city' as contact_city, payload::jsonb->'mappedEventData'->>'city' as mapped_city, payload::jsonb->>'finalLocation' as final_loc FROM pending_scrapes`);
    
    const onlineMatches = res.rows.filter(r => 
        (r.loc_str && r.loc_str.toLowerCase().includes('online')) || 
        (r.final_loc && r.final_loc.toLowerCase().includes('online')) ||
        (r.contact_city && r.contact_city.toLowerCase().includes('online')) ||
        (r.mapped_city && r.mapped_city.toLowerCase().includes('online'))
    );
    
    const blrMatches = res.rows.filter(r => 
        (r.loc_str && r.loc_str.toLowerCase().includes('bengaluru')) || 
        (r.final_loc && r.final_loc.toLowerCase().includes('bengaluru')) ||
        (r.contact_city && r.contact_city.toLowerCase().includes('bengaluru')) ||
        (r.mapped_city && r.mapped_city.toLowerCase().includes('bengaluru'))
    );
    
    console.log("Online matches that mention another city:", onlineMatches.filter(r => r.contact_city && r.contact_city !== 'Online').slice(0,2));
    console.log("Bengaluru matches that have Unknown city:", blrMatches.filter(r => r.contact_city === 'Unknown' || r.mapped_city === 'Unknown').slice(0,2));
  } finally {
    pool.end();
  }
}
checkEvents();
