const fs = require('fs');
let content = fs.readFileSync('backend/src/googleBusinessFetcher.ts', 'utf-8');

const regex = /Fields to extract:\n- orgName:(.*?)\n- images:(.*?)\n/s;
const newPrompt = `Fields to extract:
- orgName:$1
- images:$2
- accessibility: An array of strings describing accessibility features (e.g. "Wheelchair accessible entrance")
- offerings: An array of strings describing offerings (e.g. "Food", "Drinks")
- payments: An array of strings describing payment options (e.g. "Cash only", "Credit cards")
- amenities: An array of strings describing amenities (e.g. "Restroom", "Wi-Fi")
`;

if (content.match(regex)) {
    content = content.replace(regex, newPrompt);
    fs.writeFileSync('backend/src/googleBusinessFetcher.ts', content, 'utf-8');
    console.log("Updated LLM prompt to extract rich fields.");
} else {
    console.log("Failed to match regex");
}
