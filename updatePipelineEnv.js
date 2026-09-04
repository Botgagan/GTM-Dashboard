const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

// Replace hardcoded domains with FRONTEND_BASE_URL
content = content.replace(/https:\/\/stage\.sociocircle\.org/g, '${process.env.COHORT_FRONTEND_URL || "https://turbo.cohort.social"}');

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts to use env variable for frontend URL");
