const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(/const city = payload\.contactInfo\?\.city \|\| ev\?\.city;/g, 'const city = ev?.city || payload.contactInfo?.city;');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx to prioritize Event City over Organizer City in the table.");
