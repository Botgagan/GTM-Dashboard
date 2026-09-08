const fs = require('fs');
const lines = fs.readFileSync('backend/src/pipeline.ts', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('export async function retryManualOrg'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('}'));
console.log(lines.slice(start, end + 1).join('\n'));
