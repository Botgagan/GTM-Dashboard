const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://allevents.in/ahmedabad/freedom-ride-ahmedabad-pedal-with-pride-this-independence-day-tickets/80001680423919', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
}).then(r => {
    const $ = cheerio.load(r.data);
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((i, el) => {
        try {
            const data = JSON.parse($(el).html());
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
                if (item['@type'] === 'Event' || item['@type'] === 'SportsEvent' || item.organizer) {
                    console.log(JSON.stringify(item, null, 2));
                }
            }
        } catch (e) {}
    });
}).catch(console.error);
