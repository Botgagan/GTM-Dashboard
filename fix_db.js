const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

// Update getOrgEvents to use city
content = content.replace(
    `SELECT * FROM events WHERE org_id = $1 AND location ILIKE $2 ORDER BY created_at DESC`,
    `SELECT * FROM events WHERE org_id = $1 AND city ILIKE $2 ORDER BY created_at DESC`
);

// Update insertEvent interface
content = content.replace(
    `location?: string;
    hindUrl?: string;`,
    `location?: string;
    city?: string;
    hindUrl?: string;`
);

// Update insertEvent SQL
content = content.replace(
    `location, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)\`,`,
    `location, city, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)\`,
`
);

// Update insertEvent args
content = content.replace(
    `            data.location || null,
            data.hindUrl || null,`,
    `            data.location || null,
            data.city || null,
            data.hindUrl || null,`
);

fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated db.ts to support city column in events table");
