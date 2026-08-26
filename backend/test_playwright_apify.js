require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
    console.log('Starting Playwright Scraper Test...');
    
    const pageFunction = `async ({ page, request, log }) => {
        await page.waitForTimeout(3000);
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        return {
            url: request.url,
            hasRefund: bodyText.includes('refund'),
            hasAmenities: bodyText.includes('amenit'),
            hasYoutube: bodyText.includes('youtube.com') || bodyText.includes('youtu.be'),
            hasTicketLimit: bodyText.includes('max') || bodyText.includes('limit'),
            fullTextSnippet: bodyText.substring(0, 500)
        };
    }`;

    const run = await client.actor('apify/playwright-scraper').call({
        startUrls: [{ url: 'https://allevents.in/ahmedabad/freedom-ride-ahmedabad-pedal-with-pride-this-independence-day-tickets/80001680423919' }],
        pageFunction,
        proxyConfiguration: {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL']
        }
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Playwright Extraction Results:');
    console.log(JSON.stringify(items[0], null, 2));
}

run().catch(console.error);
