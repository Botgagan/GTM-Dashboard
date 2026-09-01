import axios from 'axios';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as cheerio from 'cheerio';
import { ApifyClient } from 'apify-client';

dotenv.config();

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN;

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
});

const apifyClient = new ApifyClient({
    token: APIFY_API_TOKEN || '',
});

async function scrapeWebsiteText(url: string): Promise<string> {
    try {
        const { data } = await axios.get(url, { 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const $ = cheerio.load(data);
        $('script, style, noscript, iframe, img, svg').remove();
        return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 3000);
    } catch (e) {
        return "";
    }
}

async function scrapeGoogleMapsWithApify(url: string) {
    console.log(`Starting Apify actor compass/crawler-google-places for URL: ${url}`);
    try {
        const run = await apifyClient.actor("compass/crawler-google-places").call({
            startUrls: [{ url: url }],
            maxCrawledPlacesPerSearch: 1,
            language: "en"
        });
        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();
        return items.length > 0 ? items[0] : null;
    } catch (error) {
        console.error("Apify Google Places Scraper failed:", error);
        return null;
    }
}

export async function fetchGoogleBusinessDetails(orgName: string, providedUrl?: string) {
    console.log(`\n?? Syncing Google Business for: [${orgName}] - URL: ${providedUrl || 'None'}`);

    let snippets = "";
    let websiteText = "";
    let isGoogleMapsLink = providedUrl && (providedUrl.includes('google.com/maps') || providedUrl.includes('maps.app.goo.gl'));

    if (isGoogleMapsLink) {
        snippets += `\n\n--- GOOGLE MAPS APIFY DATA ---\n`;
        const mapsData = await scrapeGoogleMapsWithApify(providedUrl!);
        if (mapsData) {
            // We just stringify the JSON for the LLM to easily parse
            snippets += JSON.stringify(mapsData, null, 2) + "\n";
            
            // If Apify found a website link inside the Google Maps profile, we can also optionally scrape that
            if (mapsData.website) {
                const txt = await scrapeWebsiteText(String(mapsData.website));
                snippets += `\n\n--- WEBSITE HOMEPAGE TEXT ---\n${txt}\n`;
            }
        }
    } else {
        let query = orgName;
        if (providedUrl) {
            websiteText = await scrapeWebsiteText(providedUrl);
            snippets += `\n\n--- PROVIDED WEBSITE TEXT ---\n${websiteText}\n`;
            query = `${orgName} ${providedUrl}`;
        } else {
            query = `${orgName} business`;
        }

        try {
            // 1. Get Google Places data specifically for the Google Maps Link
            const placesConfig = {
                method: 'post',
                url: 'https://google.serper.dev/places',
                headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
                data: JSON.stringify({ "q": query, "gl": "in" })
            };
            try {
                const placesRes = await axios.request(placesConfig);
                if (placesRes.data && placesRes.data.places && placesRes.data.places.length > 0) {
                    const place = placesRes.data.places[0];
                    snippets += `\nGOOGLE PLACES DATA:\nTitle: ${place.title}\nAddress: ${place.address}\nPhone: ${place.phoneNumber}\nWebsite: ${place.website}\nGoogle Maps Link: ${place.link}\n`;
                }
            } catch (placesErr: any) {
                console.error("Serper Places API failed:", placesErr.message);
            }

            // 2. Get standard search for knowledge graph and organic website results
            const config = {
                method: 'post',
                url: 'https://google.serper.dev/search',
                headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' },
                data: JSON.stringify({ "q": query, "gl": "in" })
            };

            const response = await axios.request(config);
            const searchResponse = response.data;

            if (searchResponse.knowledgeGraph) {
                snippets += `\nKNOWLEDGE GRAPH:\nTitle: ${searchResponse.knowledgeGraph.title || ''}\nDescription: ${searchResponse.knowledgeGraph.description || ''}\nAttributes: ${JSON.stringify(searchResponse.knowledgeGraph.attributes || {})}\n`;
                if (searchResponse.knowledgeGraph.website && !websiteText) {
                    snippets += `Website: ${searchResponse.knowledgeGraph.website}\n`;
                    const txt = await scrapeWebsiteText(searchResponse.knowledgeGraph.website);
                    snippets += `\n\n--- WEBSITE HOMEPAGE TEXT ---\n${txt}\n`;
                }
            }
            
            if (searchResponse.local && searchResponse.local.length > 0) {
                const local = searchResponse.local[0];
                snippets += `\nLOCAL BUSINESS:\nTitle: ${local.title}\nAddress: ${local.address}\nPhone: ${local.phoneNumber}\nWebsite: ${local.website}\n`;
            }

            if (searchResponse.organic) {
                snippets += `\nORGANIC SEARCH RESULTS:\n`;
                for (let i = 0; i < Math.min(3, searchResponse.organic.length); i++) {
                    snippets += `- [${searchResponse.organic[i].title}](${searchResponse.organic[i].link}): ${searchResponse.organic[i].snippet}\n`;
                }
            }
        } catch (e: any) {
            console.error("Serper API failed:", e.message);
        }
    }

    try {
        const prompt = `You are an expert data extractor. We need to auto-fill an organization's profile based on Google Search, Maps, or Website data.
Extract and compile the best possible values for the following fields based ONLY on the provided context.
Return ONLY valid JSON. If a field is completely unknown and cannot be guessed, return null or empty string.

Fields to extract:
- orgName: The clean name of the organization
- description: A good paragraph describing what they do
- googleBusinessLink: The Google Maps or Google Business link (if found in search results, otherwise null. If provided context says it's a maps direct link, use that)
- websiteUrl: The official website link (do NOT put a google link here)
- address: Their physical address if available
- phone: A primary contact phone number
- email: A primary contact email (look carefully in website text or snippets)
- logo: A URL to the organization's logo (if you can find one in the images array or website, otherwise null)
- images: An array of URLs to high-quality images representing the place (up to 3, if available)

CONTEXT:
${snippets}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You output only valid JSON without markdown wrapping." },
                { role: "user", content: prompt }
            ],
            temperature: 0.1,
            response_format: { type: "json_object" }
        });

        const raw = completion.choices[0].message.content || "{}";
        const result = JSON.parse(raw);
        console.log("? Auto-Fill Result:", result);
        
        // If they provided a Google Maps link, make sure we return it so the UI keeps it
        if (isGoogleMapsLink && !result.googleBusinessLink) {
            result.googleBusinessLink = providedUrl;
        }

        // Use Brandfetch for the absolute best logo if a website was found
        if (result.websiteUrl) {
            try {
                // Extract just the domain (e.g., https://www.zoho.com/in -> zoho.com)
                const urlObj = new URL(result.websiteUrl);
                let domain = urlObj.hostname;
                if (domain.startsWith("www.")) {
                    domain = domain.substring(4);
                }
                
                // We just generate the Brandfetch CDN URL. 
                // The frontend <img src> will render it perfectly.
                const brandfetchUrl = `https://cdn.brandfetch.io/${domain}/w/400/h/400?c=1iddcr0aNs0Q29OXkyA`;
                
                // Test if the image actually exists (Brandfetch returns 404 if not found)
                const logoTest = await axios.head(brandfetchUrl).catch(() => null);
                if (logoTest && logoTest.status === 200) {
                    result.logo = brandfetchUrl;
                    console.log("? Attached Brandfetch logo for domain:", domain);
                }
            } catch (err: any) {
                console.error("Failed to parse domain for Brandfetch:", err.message);
            }
        }
        
        return result;

    } catch (e: any) {
        console.error("? Failed to fetch Google Business details:", e.message);
        return { error: "Failed to fetch details" };
    }
}
