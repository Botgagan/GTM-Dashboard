const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://www.townscript.com/e/bragging-rights5k-power-run-150826').then(res => {
    const $ = cheerio.load(res.data);
    const bodyText = $('body').text().replace(/\s+/g, ' ');
    console.log(bodyText.substring(0, 3000));
    
    // Also log the JSON-LD to see if there is an offer
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
        console.log("JSON-LD:", $(el).html());
    });
});
