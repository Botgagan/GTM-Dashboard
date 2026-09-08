const fs = require('fs');
const lines = fs.readFileSync('backend/src/db.ts', 'utf-8').split('\n');
console.log(lines.slice(50, 60).join('\n'));
