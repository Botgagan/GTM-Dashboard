const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');
content = content.replace(/https:\/\/turbo\.cohort\.social/g, 'https://stage.sociocircle.org');
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx placeholders to stage.sociocircle.org");
