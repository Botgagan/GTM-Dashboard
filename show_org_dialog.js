const fs = require('fs');
const lines = fs.readFileSync('frontend/src/EditableOrgDialog.tsx', 'utf-8').split('\n');
console.log(lines.slice(15, 30).join('\n'));
