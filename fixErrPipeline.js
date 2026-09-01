const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');
content = content.replace('catch (err) {', 'catch (err: any) {');
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Safe patched err to err: any");
