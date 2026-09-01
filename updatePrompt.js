const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

const promptOld = `- email: A primary contact email (look carefully in website text or snippets)`;
const promptNew = `- email: A primary contact email (look carefully in website text or snippets)\n- logo: A URL to the organization's logo (if you can find one in the images array or website, otherwise null)\n- images: An array of URLs to high-quality images representing the place (up to 3, if available)`;

content = content.replace(promptOld, promptNew);
fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
console.log("Backend LLM prompt updated for images/logo.");
