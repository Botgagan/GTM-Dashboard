const fs = require('fs');
const lines = fs.readFileSync('backend/src/db.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('export async function updateOrganization'));
console.log(lines.slice(start, start + 3).join('\n'));
