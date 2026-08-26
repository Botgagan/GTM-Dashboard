require('dotenv').config();
const { ApifyClient } = require('apify-client');

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
    console.log('Starting Playwright Scraper Test...');
    
    const pageFunction = `async ({ page, request, log }) => {
        await page.waitForTimeout(5000);
        const bodyText = await page.evaluate(() => document.body.innerText);
        return {
            text: bodyText
        };
    }`;

    const run = await client.actor('apify/playwright-scraper').call({
        startUrls: [{ url: 'https://www.district.in/events/raatladi--city-of-dreams-buy-tickets' }],
        pageFunction,
        preNavigationHooks: `[
            async ({ page }) => {
                await page.route('**/*', route => {
                    const type = route.request().resourceType();
                    if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
                        route.abort();
                    } else {
                        route.continue();
                    }
                });
            }
        ]`,
        proxyConfiguration: {
            useApifyProxy: true,
            apifyProxyGroups: ['RESIDENTIAL']
        }
    });

    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log('Playwright Extraction Results:');
    if (items.length > 0) {
        console.log(items[0].text);
    } else {
        console.log('No items returned');
    }
}

run().catch(console.error);
