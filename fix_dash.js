const fs = require('fs');
let dbTs = fs.readFileSync('backend/src/db.ts', 'utf-8');

const oldFunc = `    if (city) {
        query += \` LEFT JOIN events e ON e.org_id = o.id AND e.location ILIKE $1\`;
        params.push(\`%\${city}%\`);
    } else {`;

const newFunc = `    if (city) {
        query += \` LEFT JOIN events e ON e.org_id = o.id AND (e.location ILIKE $1 OR e.city ILIKE $1)\`;
        params.push(\`%\${city}%\`);
    } else {`;

dbTs = dbTs.replace(oldFunc, newFunc);
fs.writeFileSync('backend/src/db.ts', dbTs);
console.log("Updated getDashboardData");
