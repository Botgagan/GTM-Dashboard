const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /function formatEventDateTimeString\([\s\S]*?\}[\r\n]+/m;
content = content.replace(regex, '');

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Removed formatEventDateTimeString");
