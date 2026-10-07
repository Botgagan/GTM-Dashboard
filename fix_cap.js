const fs = require('fs');
let dbTs = fs.readFileSync('backend/src/db.ts', 'utf-8');

const oldLine = `if (city && city.toLowerCase() !== 'unknown' && city.toLowerCase() !== 'n/a') {`;
const newLine = `if (city && city.toLowerCase() !== 'unknown' && city.toLowerCase() !== 'n/a') {
            const formattedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();`;
            
dbTs = dbTs.replace(/if \(city && city\.toLowerCase\(\) !== 'unknown' && city\.toLowerCase\(\) !== 'n\/a'\) \{/g, newLine);
dbTs = dbTs.replace(/cities\.add\(city\);/g, "cities.add(formattedCity);");

fs.writeFileSync('backend/src/db.ts', dbTs);
console.log("Updated getCities capitalization");
