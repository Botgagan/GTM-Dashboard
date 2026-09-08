const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.tsx', 'utf-8').split('\n');
console.log(lines.slice(17, 23).join('\n'));
