const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

// Replace createEvent fields
content = content.replace(
  `const fields = ['title', 'status', 'event_date', 'end_date', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];`,
  `const fields = ['title', 'status', 'start_date', 'start_time', 'end_date', 'end_time', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];`
);

// Replace updateEvent fields
content = content.replace(
  `const fields = ['title', 'status', 'event_date', 'end_date', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];`,
  `const fields = ['title', 'status', 'start_date', 'start_time', 'end_date', 'end_time', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];`
);

fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated db.ts fields for createEvent and updateEvent");
