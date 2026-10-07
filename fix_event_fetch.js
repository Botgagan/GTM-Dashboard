const fs = require('fs');
let appTsx = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

appTsx = appTsx.replace(
  /const resDetails = await fetch\(\`\$\{API_BASE\}\/org\/\$\{expandedOrg\.id\}\/events\`\);/,
  "const qEvent = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n          const resDetails = await fetch(`${API_BASE}/org/${expandedOrg.id}/events${qEvent}`);"
);

appTsx = appTsx.replace(
  /const res = await fetch\(\`\$\{API_BASE\}\/org\/\$\{orgId\}\/events\`\);/,
  "const qEvent = globalCityFilter !== 'All' ? `?city=${encodeURIComponent(globalCityFilter)}` : '';\n        const res = await fetch(`${API_BASE}/org/${orgId}/events${qEvent}`);"
);

fs.writeFileSync('frontend/src/App.tsx', appTsx);
console.log("Updated App.tsx to pass city parameter to events fetch");
