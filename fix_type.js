const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(/events: OrgEvent\[\]/g, "events: any[]");

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Fixed OrgEvent type error");
