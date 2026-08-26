const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://meraevents.com/events/internship-september').then(res => {
    const rawHtml = res.data;
    const startDateMatch = rawHtml.match(/"startDate"\s*:\s*"([^"]+)"/i);
    console.log(startDateMatch ? startDateMatch[1] : null);
});
