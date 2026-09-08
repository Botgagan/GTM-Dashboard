const fs = require('fs');
let content = fs.readFileSync('backend/src/discoveryEngine.ts', 'utf-8');

const regex = /if \(scrapedData\) \{\s*console\.log\(`\\n\[Discovery Engine\] Initiating extraction for: \$\{item\.url\}`\);\s*await processUrl\(item\.url, \(msg\) => console\.log\(`   > \$\{msg\}`\), scrapedData\);\s*await pool\.query\(\s*`UPDATE scraped_urls_history SET status = 'success', processed_at = NOW\(\) WHERE id = \$1`,\s*\[dbId\]\s*\);\s*console\.log\(`\[Discovery Engine\] ? Successfully processed: \$\{item\.url\}`\);\s*\} else \{\s*throw new Error\("Apify did not return data for this URL"\);\s*\}/s;

const replacement = `console.log(\`\\n[Discovery Engine] Initiating extraction for: \${item.url}\`);
            if (scrapedData) {
                await processUrl(item.url, (msg) => console.log(\`   > \${msg}\`), scrapedData);
            } else {
                console.log(\`[Discovery Engine] Apify data missing for \${item.url}, relying on Cheerio fallback inside pipeline...\`);
                await processUrl(item.url, (msg) => console.log(\`   > \${msg}\`));
            }
            
            await pool.query(
                \`UPDATE scraped_urls_history SET status = 'success', processed_at = NOW() WHERE id = $1\`,
                [dbId]
            );
            console.log(\`[Discovery Engine] ? Successfully processed: \${item.url}\`);`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('backend/src/discoveryEngine.ts', content, 'utf-8');
    console.log("Updated discoveryEngine to use Cheerio fallback");
} else {
    console.log("Regex not found in discoveryEngine");
}
