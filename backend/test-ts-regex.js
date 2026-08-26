const axios = require('axios');
axios.get('https://www.townscript.com/e/ahmedabad-virtual-challenge-411120').then(res => {
    const match = res.data.match(/"startDate"\s*:\s*"([^"]+)"/i);
    console.log(match);
}).catch(e => console.log(e.message));
