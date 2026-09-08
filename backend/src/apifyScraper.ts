import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
import { getPlatformHandler } from './platforms/router';
import { getGenericPageFunction } from './platforms/base';
dotenv.config();

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: process.env.APIFY_API_TOKEN || '',
});

export async function scrapeAllEvents(url: string) {
    console.log(`Starting Apify Playwright Headless Browser with Residential Proxies for URL: ${url}...`);
    
    // Check if we have a specific domain handler, otherwise fallback to the generic AI one
    const handler = getPlatformHandler(url);
    const pageFunction = handler ? handler.getPageFunction() : getGenericPageFunction();

    try {
        const run = await client.actor("apify/playwright-scraper").call({
            startUrls: [{ url }],
            pageFunction,
            proxyConfiguration: { useApifyProxy: true }
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
        
    } catch (error) {
        console.error("Apify Scrape failed:", error);
        return [];
    }
}

export async function scrapeBatchWithApify(urls: string[]) {
    console.log(`Starting ONE Apify Playwright Actor for ${urls.length} URLs to save costs...`);
    
    // We use the generic page function because we are mixing platforms in a single run
    const pageFunction = getGenericPageFunction();

    try {
        const run = await client.actor("apify/playwright-scraper").call({
            startUrls: urls.map(url => ({ url })),
            pageFunction,
            proxyConfiguration: { useApifyProxy: true }
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        return items;
        
    } catch (error) {
        console.error("Apify Batch Scrape failed:", error);
        return [];
    }
}
