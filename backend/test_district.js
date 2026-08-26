const axios = require('axios');
const cheerio = require('cheerio');

axios.get('https://www.district.in/events/sachi-navaratri-ac-dome-garaba-2026-buy-tickets', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
}).then(res => {
    const $ = cheerio.load(res.data);
    // Remove JSON-LD from body text extraction
    $('script').remove();
    $('style').remove();
    
    const bodyText = $('body').text();
    console.log("=== BEGIN TEXT ===");
    console.log(bodyText.replace(/\s+/g, ' ').substring(0, 2000));
    console.log("=== END TEXT ===");
}).catch(console.error);
