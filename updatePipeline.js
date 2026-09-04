const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');
content = content.replace(/https:\/\/turbo\.cohort\.social/g, 'https://stage.sociocircle.org');
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts frontend URLs to stage.sociocircle.org");
