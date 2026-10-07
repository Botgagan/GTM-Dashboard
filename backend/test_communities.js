const axios = require('axios');
require('dotenv').config({ path: 'C:/event scraping demo/backend/.env' });

async function getCommunities() {
    try {
        const headers = { 'Authorization': `Bearer ${process.env.COHORT_ACCESS_TOKEN}` };
        // Try getting user memberships
        const res = await axios.get('https://devapi.cohort.social/community', { headers });
        console.log(JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.error("Failed /community:", e.message);
    }
}
getCommunities();
