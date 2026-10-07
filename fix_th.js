const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  "<TableHead>Source URL</TableHead>",
  "<TableHead>Event Type</TableHead>\n            <TableHead>Source URL</TableHead>"
);
appTsx = appTsx.replace(
  "colSpan={11}",
  "colSpan={12}"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated TableHeaders");
