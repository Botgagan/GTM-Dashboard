const axios = require('axios');
async function fetchTitle() {
    try {
        const res = await axios.get('https://turbo.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8');
        const match = res.data.match(/<title>(.*?)<\/title>/);
        console.log(match ? match[1] : "No title found");
    } catch(e) {
        console.log("Failed:", e.message);
    }
}
fetchTitle();
