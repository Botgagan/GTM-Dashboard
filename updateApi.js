const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf-8');
content = content.replace(/https:\/\/devapi\.cohort\.social/g, 'https://stageapi.sociocircle.org');
fs.writeFileSync('backend/src/apiClient.ts', content, 'utf-8');
console.log("Updated apiClient.ts URLs to stageapi.sociocircle.org");
