const axios = require("axios");

async function test() {
  const data = JSON.stringify({
    "q": "Zoho India",
    "gl": "in"
  });

  const config = {
    method: 'post',
    url: 'https://google.serper.dev/places',
    headers: { 
      'X-API-KEY': process.env.SERPER_API_KEY, 
      'Content-Type': 'application/json'
    },
    data : data
  };

  try {
      const response = await axios(config);
      console.log(JSON.stringify(response.data.places[0], null, 2));
  } catch(e) {
      console.error(e.message);
  }
}
test();
