const axios = require('axios');
const fs = require('fs');

async function test() {
    const query = `Jyot foundation email OR contact OR phone`;
    console.log("Query:", query);
    try {
        const response = await axios.post('https://google.serper.dev/search', {
            q: query,
            gl: "in"
        }, {
            headers: {
                'X-API-KEY': '4f1d9068372f8f88714577785f242bcc74b98dc9',
                'Content-Type': 'application/json'
            }
        });
        
        fs.writeFileSync('serper_output.json', JSON.stringify(response.data, null, 2));
        console.log("Saved to serper_output.json");
    } catch(e) {
        console.error(e.message);
    }
}
test();
