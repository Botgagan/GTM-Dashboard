const axios = require('axios');
const cheerio = require('cheerio');
axios.get('https://meraevents.com/events/internship-september').then(res => {
    const $ = cheerio.load(res.data);
    console.log($('body').text().match(/.{0,30}12:30.{0,30}/g));
});
