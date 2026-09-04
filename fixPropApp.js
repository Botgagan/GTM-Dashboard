const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(
  /<PendingEventRow\s*\n\s*key=\{scrape\.id\}\s*\n\s*scrape=\{scrape\}\s*\n\s*onRefresh=\{onRefresh\}/g,
  '<PendingEventRow \n                key={scrape.id} \n                scrape={scrape} \n                orgs={orgs}\n                onRefresh={onRefresh}'
);

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Fixed missing orgs prop on line 398");
