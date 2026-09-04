const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');
content = content.replace(/https:\/\/stage\.sociocircle\.org/g, 'https://turbo.cohort.social');
fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Updated App.tsx placeholders back to turbo");
