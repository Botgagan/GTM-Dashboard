const axios = require('axios');
require('dotenv').config({ path: 'C:/event scraping demo/backend/.env' });

async function getCommunityInfo() {
    try {
        const headers = { 'Authorization': `Bearer ${process.env.COHORT_ACCESS_TOKEN}` };
        const res = await axios.get('https://devapi.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8', { headers });
        console.log(JSON.stringify(res.data, null, 2));
    } catch(e) {
        console.error("Failed:", e.message);
        if (e.response && e.response.data) {
            console.error(JSON.stringify(e.response.data, null, 2));
        }
    }
}
getCommunityInfo();
