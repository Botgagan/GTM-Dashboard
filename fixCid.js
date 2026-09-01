const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldLine = `googleBusinessLink = placesRes.data.places[0].link || "";`;
const newLine = `const place = placesRes.data.places[0];
                    googleBusinessLink = place.link || (place.cid ? \`https://maps.google.com/?cid=\${place.cid}\` : "");`;

content = content.replace(oldLine, newLine);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts to fallback to CID for Google Maps link.");
