const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

content = content.replace('hindStatus?: string;', 'hindStatus?: string;\n    richData?: any;');

fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Fixed db.ts TypeScript signature");
