import axios from 'axios';
import { pool } from './db';
import { processUrl } from './pipeline';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

export async function runDailyDiscovery() {
    console.log(`[Discovery Engine] Starting daily URL discovery...`);
    
    // 1. Get active platforms
    const { rows: platforms } = await pool.query(
        `SELECT id, name, domain, search_path FROM scraping_platforms WHERE is_active = true`
    );

    if (platforms.length === 0) {
        console.log(`[Discovery Engine] No active platforms found. Exiting.`);
        return;
    }

    const discoveredUrls: { url: string; platform_id: string }[] = [];

    // 2. Discover URLs for each platform
    for (const platform of platforms) {
        console.log(`[Discovery Engine] Searching for new events on ${platform.name}...`);
        
        try {
            // Using qdr:w (past week) and gl:in (India) to get the freshest Indian events
            // We also append negative keywords to filter out non-event pages directly from Google
            const query = `${platform.search_path} "2026" -inurl:blog -inurl:blogs -inurl:category -inurl:organizer -inurl:o`; 
            
            const response = await axios.post(
                'https://google.serper.dev/search',
                {
                    q: query,
                    gl: "in",
                    tbs: "qdr:w",
                    num: 10 // Request enough to filter out non-event links
                },
                {
                    headers: {
                        'X-API-KEY': SERPER_API_KEY,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const organicResults = response.data.organic || [];
            
            // Filter out junk URLs and limit to maximum 2 per platform
            const validUrls = organicResults
                .map((res: any) => res.link)
                .filter((link: string) => {
                    if (!link || !link.includes(platform.domain)) return false;
                    
                    // Exclude blogs, categories, and organizer profiles
                    const lowerLink = link.toLowerCase();
                    if (lowerLink.includes('/blog/') || 
                        lowerLink.includes('/blogs/') || 
                        lowerLink.includes('/category/') ||
                        lowerLink.includes('/o/') || 
                        lowerLink.includes('/organizer/')) {
                        return false;
                    }
                    
                    // For townscript, ignore unpublished draft URLs which usually don't have enough structure
                    if (lowerLink.includes('townscript.com/e/') && lowerLink.length < 35) {
                         return false;
                    }

                    // Platform specific strict event URL structures
                    if (platform.domain === 'allevents.in') {
                        // valid events usually end with a long ID or use /e/
                        if (!/\/\d{10,}$/.test(lowerLink) && !lowerLink.includes('/e/')) {
                            return false;
                        }
                    }
                    if (platform.domain === 'tykkit.com') {
                        // valid events must have /events/ or /e/
                        if (!lowerLink.includes('/events/') && !lowerLink.includes('/e/')) {
                            return false;
                        }
                    }
                    if (platform.domain === 'wowsly.com') {
                        // valid events must have /e/ or /event/
                        if (!lowerLink.includes('/e/') && !lowerLink.includes('/event/')) {
                            return false;
                        }
                    }
                    if (lowerLink.includes('localhost')) {
                        return false;
                    }
                    
                    return true;
                })
                .slice(0, 2); 

            if (validUrls.length === 0) {
                console.log(`[Discovery Engine] No fresh URLs found for ${platform.name} today.`);
            } else {
                console.log(`[Discovery Engine] Found ${validUrls.length} URLs for ${platform.name}:`);
                validUrls.forEach((url: string, index: number) => {
                    console.log(`   ${index + 1}. ${url}`);
                    discoveredUrls.push({ url, platform_id: platform.id });
                });
            }
        } catch (error: any) {
            console.error(`[Discovery Engine] Error searching platform ${platform.name}:`, error.message);
        }
    }

    console.log(`[Discovery Engine] Total discovered URLs today: ${discoveredUrls.length}`);

    if (discoveredUrls.length === 0) return;

    // 3. Import the new batch scraper
    const { scrapeBatchWithApify } = require('./apifyScraper');

    // 4. Fire the single optimized Apify run for all URLs
    const urlsToScrape = discoveredUrls.map(item => item.url);
    console.log(`[Discovery Engine] Firing ONE optimized Apify Actor run for ${urlsToScrape.length} URLs...`);
    
    // Mark all as processing initially
    const insertedIds = new Map();
    for (const item of discoveredUrls) {
        const res = await pool.query(
            `INSERT INTO scraped_urls_history (url, platform_id, status) VALUES ($1, $2, 'processing') 
             ON CONFLICT (url) DO UPDATE SET status = 'processing', discovered_at = NOW() 
             RETURNING id`,
            [item.url, item.platform_id]
        );
        insertedIds.set(item.url, res.rows[0].id);
    }

    // Run batch scraper
    const scrapedItems = await scrapeBatchWithApify(urlsToScrape);

    // 5. Process results
    for (const item of discoveredUrls) {
        const dbId = insertedIds.get(item.url);
        // Find the matched scraped data using exact or fuzzy match (ignoring query params)
        const scrapedData = scrapedItems.find((res: any) => {
            if (res.url === item.url || res.requestedUrl === item.url) return true;
            
            // Fuzzy match: Strip query strings and trailing slashes
            const cleanItemUrl = item.url.split('?')[0].replace(/\/$/, '');
            const cleanResUrl = (res.url || '').split('?')[0].replace(/\/$/, '');
            const cleanReqUrl = (res.requestedUrl || '').split('?')[0].replace(/\/$/, '');
            
            return cleanResUrl === cleanItemUrl || cleanReqUrl === cleanItemUrl;
        });

        try {
            if (scrapedData) {
                console.log(`\n[Discovery Engine] Initiating extraction for: ${item.url}`);
                await processUrl(item.url, (msg) => console.log(`   > ${msg}`), scrapedData);
                
                await pool.query(
                    `UPDATE scraped_urls_history SET status = 'success', processed_at = NOW() WHERE id = $1`,
                    [dbId]
                );
                console.log(`[Discovery Engine] ✅ Successfully processed: ${item.url}`);
            } else {
                throw new Error("Apify did not return data for this URL");
            }
        } catch (error: any) {
            console.error(`[Discovery Engine] ❌ Failed to process ${item.url}:`, error.message);
            await pool.query(
                `UPDATE scraped_urls_history SET status = 'failed', processed_at = NOW() WHERE id = $1`,
                [dbId]
            );
        }
    }

    console.log(`[Discovery Engine] Daily discovery and batch extraction completed!`);
}
