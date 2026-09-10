const fs = require('fs');

let content = fs.readFileSync('backend/src/apiClient.ts', 'utf-8');

// The literal bad string we injected
const badString = 'throw new Error(error?.response?.data?.message || error?.message || "Failed to create subcommunity in Cohort API");\\r?\\n}';
const goodString = 'return null;\n}';

// Wait, the first one we actually wanted to throw an error, but the other ones (getAdminInviteLink, getSubcommunityDetails, checkMembership) might just need to return null.
// Let's restore ALL of them to `return null;\n}` except the one in `createSubcommunity` which I already manually fixed.
// Actually, let's just replace all occurrences of the bad string with `return null;\n}`.

content = content.split(badString).join('return null;\n}');

fs.writeFileSync('backend/src/apiClient.ts', content);
console.log("Fixed apiClient.ts");
