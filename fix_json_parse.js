const fs = require('fs');
let content = fs.readFileSync('frontend/src/App.tsx', 'utf-8');

const regex = /const payload = typeof scrape\.payload === 'string' \? JSON\.parse\(scrape\.payload\) : scrape\.payload;/g;

const replacement = `let payload = {};
      try {
        payload = typeof scrape.payload === 'string' ? JSON.parse(scrape.payload) : scrape.payload;
      } catch (e) {
        console.error("Failed to parse payload", e);
      }`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('frontend/src/App.tsx', content, 'utf-8');
    console.log("Added try-catch to JSON.parse");
} else {
    console.log("Could not find JSON.parse to replace");
}
