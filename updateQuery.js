const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldQuery = `data: JSON.stringify({ "q": \`\${primaryOrganizer} \${locationStr}\`, "gl": "in" })`;
const newQuery = `data: JSON.stringify({ "q": primaryOrganizer, "gl": "in" })`;

content = content.replace(oldQuery, newQuery);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated Serper Places query to only use organization name.");
