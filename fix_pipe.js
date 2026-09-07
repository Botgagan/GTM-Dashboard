const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

content = content.replace(
    `location: finalLocation,`,
    `location: finalLocation,\n        city: contactInfo.city || p.locationStr || mappedEventData.city,`
);

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts to insert city");
