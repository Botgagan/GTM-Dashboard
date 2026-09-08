const fs = require('fs');
const lines = fs.readFileSync('frontend/src/App.tsx', 'utf-8').split('\n');
const start = lines.findIndex(l => l.includes('function EditableEventRow'));
const end = lines.findIndex((l, i) => i > start && l.startsWith('}'));
console.log(lines.slice(start, end).join('\n'));
