const https = require('https'); 
https.get('https://www.district.in/events/raatladi--city-of-dreams-buy-tickets', (res) => { 
    let data = ''; 
    res.on('data', (chunk) => data += chunk); 
    res.on('end', () => { 
        const matches = [...data.matchAll(/date_string(?:_v2)?\\*["']?\\*\s*:\s*\\*["']?([^"'\\]+)/gi)]; 
        console.log(matches.map(m => m[1])); 
    }); 
});
