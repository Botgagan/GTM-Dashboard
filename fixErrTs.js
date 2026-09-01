const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

// Fix the catch block for the Brandfetch TS error
content = content.replace(
    '} catch (err) {',
    '} catch (err: any) {'
);

fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
console.log("Fixed the err typing in the Brandfetch catch block.");
