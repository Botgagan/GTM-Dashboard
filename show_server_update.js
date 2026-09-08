const fs = require('fs');
const lines = fs.readFileSync('backend/src/server.ts', 'utf-8').split('\n');
console.log(lines.slice(175, 195).join('\n'));
