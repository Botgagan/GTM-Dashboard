const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');
content = content.replace(/https:\/\/devapi\.cohort\.social/g, 'https://stageapi.sociocircle.org');
fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Updated server.ts URLs to stageapi.sociocircle.org");
