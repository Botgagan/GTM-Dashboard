const fs = require('fs');
let content = fs.readFileSync('backend/src/apiClient.ts', 'utf-8');

// The base URL config
const envSetup = `import axios from 'axios';
const API_BASE_URL = process.env.COHORT_API_URL || 'https://devapi.cohort.social';`;

content = content.replace(/import axios from 'axios';/, envSetup);

// Replace hardcoded domains with API_BASE_URL
content = content.replace(/'https:\/\/stageapi\.sociocircle\.org(.*?)'/g, '`${API_BASE_URL}$1`');
content = content.replace(/`https:\/\/stageapi\.sociocircle\.org(.*?)`/g, '`${API_BASE_URL}$1`');

fs.writeFileSync('backend/src/apiClient.ts', content, 'utf-8');
console.log("Updated apiClient.ts to use env variable for base URL");
