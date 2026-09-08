const fs = require('fs');
const lines = fs.readFileSync('backend/src/server.ts', 'utf-8').split('\n');
console.log(lines.slice(214, 226).join('\n'));
