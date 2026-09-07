const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

content = content.replace(
    `WHERE ps.payload::jsonb -> 'mappedEventData' ->> 'location' ILIKE $1`,
    `WHERE ps.payload::jsonb -> 'contactInfo' ->> 'city' ILIKE $1`
);

fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated getPendingScrapes to query contactInfo.city instead of location");
