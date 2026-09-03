const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');
content = content.replace('export async function DUMMY', '');
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Cleaned up DUMMY");
