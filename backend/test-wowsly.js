const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://wowsly.com/events/comedy-ka-double-dose-live-with-krushna-abhishek-rajiv-thakur/3010/').then(res => {
    const $ = cheerio.load(res.data);
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    console.log("DOM TEXT:", bodyText.substring(0, 3000));
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
        console.log('JSON-LD:', $(el).html());
    });
}).catch(console.error);
