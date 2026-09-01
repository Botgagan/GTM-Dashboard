const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

// Fix TS error 1: mapsData.website to string
content = content.replace(
    'const txt = await scrapeWebsiteText(mapsData.website);',
    'const txt = await scrapeWebsiteText(String(mapsData.website));'
);

// Fix TS error 2: placesErr is of type unknown
content = content.replace(
    '} catch (placesErr) {',
    '} catch (placesErr: any) {'
);

fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
console.log("TS errors fixed in googleBusinessFetcher.");
