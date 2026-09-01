const axios = require("axios");

async function test() {
  const data = JSON.stringify({
    "q": "hind social",
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
      if (response.data.places && response.data.places.length > 0) {
          console.log("Found Google Maps Link:", response.data.places[0].link);
          console.log("Full Data:", JSON.stringify(response.data.places[0], null, 2));
      } else {
          console.log("No places found for 'hind social'");
      }
  } catch(e) {
      console.error(e.message);
  }
}
test();
