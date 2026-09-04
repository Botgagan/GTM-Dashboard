const fs = require('fs');
let content = fs.readFileSync('backend/src/server.ts', 'utf-8');

// The base URL config
const envSetup = `const API_BASE_URL = process.env.COHORT_API_URL || 'https://devapi.cohort.social';`;
// We will just find the exact line and replace it
content = content.replace(/https:\/\/stageapi\.sociocircle\.org/g, '${process.env.COHORT_API_URL || "https://devapi.cohort.social"}');

fs.writeFileSync('backend/src/server.ts', content, 'utf-8');
console.log("Updated server.ts to use env variable for base URL");
