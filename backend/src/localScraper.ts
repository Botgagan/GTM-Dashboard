const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

export async function scrapeEventWithPlaywright(url: string) {
    console.log(`Starting Local Stealth Headless Browser for URL: ${url}...`);
    
    // Launch a local headless browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        console.log("Navigating to page and waiting for JS to load...");
        // Wait until there are no more than 2 network connections for at least 500 ms.
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Wait a few extra seconds just in case of dynamic JS components
        await page.waitForTimeout(3000);
        
        console.log("Extracting all possible data points...");
        
        const eventData = await page.evaluate(() => {
            // Title
            const title = document.title.split('|')[0].trim() || document.querySelector('h1')?.textContent?.trim();
            
            // Organizer
            let organizer = 'Unknown Organizer';
            const hostEl = document.querySelector('.eps-org-name') || document.querySelector('.host-name') || document.querySelector('[data-tb-region="host-info"]');
            if (hostEl) {
                organizer = hostEl.textContent?.trim() || 'Unknown Organizer';
            }
            
            // Full Description
            const description = document.querySelector('.event-description-html')?.textContent?.trim() || 'No description provided.';
            
            // Dates & Times
            const dateRaw = document.querySelector('.event-date')?.textContent?.trim() || 'Check website';
            
            // Location
            const locationRaw = document.querySelector('.venue-details')?.textContent?.trim() || 'Ahmedabad';
            
            // Image
            const imgEl = document.querySelector('.event-banner img, .banner-image img, .thumb img');
            const imageUrl = imgEl ? (imgEl as HTMLImageElement).src : null;
            
            // Price (if any tickets shown)
            const priceEl = document.querySelector('.price, .ticket-price, .amount');
            const price = priceEl ? priceEl.textContent?.replace(/[^0-9.]/g, '') : "0";

            return {
                title,
                organizer,
                description,
                dateRaw,
                locationRaw,
                imageUrl,
                price,
                url: window.location.href
            };
        });
        
        await browser.close();
        return [eventData];
        
    } catch (error) {
        console.error("Local Playwright Scrape failed:", error);
        await browser.close();
        return [];
    }
}
