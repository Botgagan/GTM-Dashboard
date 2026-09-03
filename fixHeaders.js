const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

const badHeader = `const headers = { 'accept': 'application/json' };`;
const goodHeader = `const headers: Record<string, string> = { 'accept': 'application/json' };`;

content = content.replace(badHeader, goodHeader);
fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Fixed headers typing");
