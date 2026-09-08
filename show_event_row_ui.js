const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('if (isEditing) {'));
console.log(lines.slice(start, start + 30).join('\n'));
