const fs = require('fs');
let dbTs = fs.readFileSync('backend/src/db.ts', 'utf-8');

const oldFunc = `export async function getCities() {
    const res = await pool.query(\`SELECT DISTINCT location FROM events WHERE location IS NOT NULL\`);
    const rawLocations = res.rows.map(r => r.location);
    const cities = new Set<string>();
    for (const loc of rawLocations) {
        const parts = loc.split(',');
        const city = parts[parts.length - 1].trim();
        if (city) cities.add(city);
    }
    return Array.from(cities).sort();
}`;

const newFunc = `export async function getCities() {
    // 1. Get cities from approved events
    const res = await pool.query(\`SELECT DISTINCT location FROM events WHERE location IS NOT NULL\`);
    const rawLocations = res.rows.map(r => r.location);
    
    // 2. Get cities from pending scraped events (JSON payload)
    const pendingRes = await pool.query(\`
        SELECT 
            payload::jsonb -> 'contactInfo' ->> 'city' as city1,
            payload::jsonb ->> 'locationStr' as city2,
            payload::jsonb ->> 'finalLocation' as city3,
            payload::jsonb -> 'mappedEventData' ->> 'city' as city4,
            payload::jsonb -> 'mappedEventData' ->> 'location' as city5
        FROM pending_scrapes
    \`);
    
    const cities = new Set<string>();
    
    // Process approved events
    for (const loc of rawLocations) {
        const parts = loc.split(',');
        const city = parts[parts.length - 1].trim();
        if (city && city.toLowerCase() !== 'unknown' && city.toLowerCase() !== 'n/a') {
            cities.add(city);
        }
    }
    
    // Process pending events
    for (const row of pendingRes.rows) {
        const possibleCities = [row.city1, row.city2, row.city3, row.city4, row.city5];
        for (const loc of possibleCities) {
            if (loc && typeof loc === 'string') {
                const parts = loc.split(',');
                const city = parts[parts.length - 1].trim();
                if (city && city.toLowerCase() !== 'unknown' && city.toLowerCase() !== 'n/a') {
                    cities.add(city);
                    break; // Just need one valid city per pending event to populate the master list
                }
            }
        }
    }
    
    return Array.from(cities).sort();
}`;

dbTs = dbTs.replace(oldFunc, newFunc);
fs.writeFileSync('backend/src/db.ts', dbTs);
console.log("Updated getCities");
