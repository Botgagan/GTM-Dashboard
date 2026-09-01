const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

content = content.replace(/onValueChange=\{setGlobalCityFilter\}/g, 'onValueChange={(v: any) => setGlobalCityFilter(v)}');
content = content.replace(/onValueChange=\{\(v\) => setSelectedLocation\(v \|\| "All Locations"\)\}/g, 'onValueChange={(v: any) => setSelectedLocation(v || "All Locations")}');
content = content.replace(/onValueChange=\{\(v\) => setExpandedPending\(\{ id: activeScrape\.id, type: 'org' \}\)\}/g, ''); // just in case

fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
console.log("Types fixed.");
