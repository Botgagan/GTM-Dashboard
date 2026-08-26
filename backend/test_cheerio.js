const axios = require('axios');
const cheerio = require('cheerio');

async function test() {
    try {
        const response = await axios.get('https://allevents.in/ahmedabad/azadi-run-powered-by-heineken00-tickets/80002032567716');
        const $ = cheerio.load(response.data);
        
        // Find JSON-LD scripts
        const scripts = $('script[type="application/ld+json"]');
        let foundOrganizer = "Not found";
        
        scripts.each((i, el) => {
            try {
                const data = JSON.parse($(el).html());
                
                // If it's an array, look through it
                const items = Array.isArray(data) ? data : [data];
                for (const item of items) {
                    if (item['@type'] === 'Event' || item['@type'] === 'SportsEvent' || item.organizer) {
                        if (item.organizer && item.organizer.name) {
                            foundOrganizer = item.organizer.name;
                        } else if (item.performer && item.performer.name) {
                            foundOrganizer = item.performer.name;
                        }
                    }
                }
            } catch (e) {}
        });

        console.log('Organizer from JSON-LD:', foundOrganizer);
        
        // Let's also look for traditional text just in case
        console.log('Or from HTML:', $('.host-name').text().trim() || $('[data-tb-region="host-info"]').text().trim() || $('.eps-org-name').text().trim());

    } catch (e) {
        console.error('Error fetching:', e.response ? e.response.status : e.message);
    }
}
test();
