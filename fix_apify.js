const fs = require('fs');
let content = fs.readFileSync('backend/src/apifyScraper.ts', 'utf-8');

// Replace proxy configuration in both functions
content = content.replace(/proxyConfiguration:\s*\{\s*useApifyProxy:\s*true,\s*apifyProxyGroups:\s*\["RESIDENTIAL"\]\s*\}/g, `proxyConfiguration: { useApifyProxy: true }`);

fs.writeFileSync('backend/src/apifyScraper.ts', content, 'utf-8');
console.log("Removed Residential proxies requirement from Apify to fix 403 error.");
