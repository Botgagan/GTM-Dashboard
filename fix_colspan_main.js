const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(/colSpan=\{7\}/g, 'colSpan={10}');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed colSpan for empty scraped events state");
