import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import axios from 'axios';
import * as cheerio from 'cheerio';

dotenv.config();

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: OPENROUTER_API_KEY,
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
        
        // Remove scripts and styles
        $('script, style, noscript, iframe, img, svg').remove();
        
        let text = `--- HOMEPAGE (${url}) ---\n` + $('body').text().replace(/\s+/g, ' ').trim();
        
        // Find multiple subpages (Contact, About, Support, Reach Us)
        const subpageLinks = new Set<string>();
        $('a').each((_, el) => {
            const href = $(el).attr('href');
            const linkText = $(el).text().toLowerCase();
            if (href) {
                const hLower = href.toLowerCase();
                // Check if link implies contact info
                if (hLower.includes('contact') || hLower.includes('about') || hLower.includes('support') || hLower.includes('reach') ||
                    linkText.includes('contact') || linkText.includes('about') || linkText.includes('support') || linkText.includes('reach')) {
                    
                    // Exclude mailto: and tel: links from being scraped as HTML pages, 
                    // though they usually appear in the text anyway
                    if (!hLower.startsWith('mailto:') && !hLower.startsWith('tel:') && !hLower.startsWith('javascript:')) {
                        try {
                            const absUrl = new URL(href, url).href;
                            subpageLinks.add(absUrl);
                        } catch(e) {}
                    }
                }
            }
        });

        // Scrape up to 3 relevant subpages to avoid massive token usage/infinite loops
        const linksToScrape = Array.from(subpageLinks).slice(0, 3);
        for (const subpageUrl of linksToScrape) {
            try {
                console.log(`   🔗 Scraping subpage: ${subpageUrl}`);
                const subpageRes = await axios.get(subpageUrl, { 
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });
                const $subpage = cheerio.load(subpageRes.data);
                $subpage('script, style, noscript, iframe, img, svg').remove();
                text += `\n\n--- SUBPAGE (${subpageUrl}) ---\n\n` + $subpage('body').text().replace(/\s+/g, ' ').trim();
            } catch (e: any) {
                console.log(`   ⚠️ Failed to scrape subpage ${subpageUrl}: ${e.message}`);
            }
        }
        
        return text.substring(0, 30000); // Limit tokens for LLM, allowing up to ~7-10k tokens
    } catch (error: any) {
        console.log(`   ⚠️ Failed to scrape ${url}: ${error.message}`);
        return "";
    }
}

export interface ContactInfo {
    emails: string[];
    phones: string[];
    website?: string;
    address?: string;
    city?: string;
    members_count?: number;
    facebook?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
}

export async function findEmailViaGoogleSearch(organizerName: string, locationStr: string): Promise<ContactInfo> {
    const emptyResult: ContactInfo = { emails: [], phones: [] };
    if (!organizerName) return emptyResult;

    const cleanName = organizerName.replace(/["']/g, '').trim();
    const query = `${cleanName} email OR contact OR phone`;
    console.log(`\n🔍 Searching Google (via Serper) for: [${query}]...`);

    try {
        let requestData = JSON.stringify({
            "q": query,
            "gl": "in" 
        });

        const config = {
            method: 'post',
            url: 'https://google.serper.dev/search',
            headers: { 
                'X-API-KEY': SERPER_API_KEY, 
                'Content-Type': 'application/json'
            },
            data: requestData
        };

        const response = await axios.request(config);
        const searchResponse = response.data;

        if (!searchResponse.organic || searchResponse.organic.length === 0) {
            console.log("❌ No Google search results found.");
            return emptyResult;
        }

        let snippets = "";
        
        if (searchResponse.answerBox) {
            snippets += `ANSWER BOX / AI OVERVIEW:\n${searchResponse.answerBox.snippet || searchResponse.answerBox.answer || JSON.stringify(searchResponse.answerBox)}\n\n`;
        }
        if (searchResponse.knowledgeGraph) {
            snippets += `KNOWLEDGE GRAPH:\nDescription: ${searchResponse.knowledgeGraph.description || ''}\nAttributes: ${JSON.stringify(searchResponse.knowledgeGraph.attributes || {})}\n\n`;
        }
        
        snippets += "ORGANIC RESULTS:\n" + searchResponse.organic.map((res: any) => `URL: ${res.link}\nTitle: ${res.title}\nContent: ${res.snippet}`).join("\n\n");

        // Fast social media link extraction
        let facebook, instagram, youtube, linkedin;
        if (searchResponse.organic && Array.isArray(searchResponse.organic)) {
            for (const res of searchResponse.organic) {
                const url = res.link.toLowerCase();
                // Match profile links, avoid root homepage or login pages
                if (!facebook && url.includes('facebook.com/') && !url.includes('/login') && !url.includes('/share') && new URL(res.link).pathname.length > 2) {
                    facebook = res.link;
                }
                if (!instagram && url.includes('instagram.com/') && !url.includes('/p/') && !url.includes('/reel/') && !url.includes('/explore') && new URL(res.link).pathname.length > 2) {
                    instagram = res.link;
                }
                if (!linkedin && (url.includes('linkedin.com/company/') || url.includes('linkedin.com/in/')) && new URL(res.link).pathname.length > 2) {
                    linkedin = res.link;
                }
                if (!youtube && url.includes('youtube.com/') && !url.includes('/watch') && !url.includes('/results') && new URL(res.link).pathname.length > 2) {
                    youtube = res.link;
                }
            }
        }

        const urlPrompt = `You are an AI assistant helping to find the official website for an event organizer.
        Organizer Name: "${organizerName}"
        Event Location: "${locationStr}"
        
        Search Results:
        ${snippets}
        
        Task: Identify the official website URL of the organizer from the Search Results. 
        WARNING: Avoid directories (like Facebook, Instagram, AllEvents, Bookmyshow, Youtube).
        If you find a highly probable official website, return ONLY the URL. If none exists or you are unsure, return exactly "none".`;

        const urlResponse = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: urlPrompt }],
            temperature: 0.0
        });

        const officialUrl = urlResponse.choices[0].message?.content?.trim() || "none";
        
        let extractionText = snippets; 
        
        if (officialUrl !== "none" && officialUrl.startsWith("http")) {
            console.log(`🌐 Official website identified: ${officialUrl}`);
            
            let baseUrl = officialUrl;
            try {
                const parsedUrl = new URL(officialUrl);
                baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
            } catch (e) {}
            
            console.log(`   Scraping base website (${baseUrl}) and its subpages...`);
            const scrapedText = await scrapeWebsiteText(baseUrl);
            
            if (scrapedText.length > 50) {
                extractionText = snippets + "\n\n--- SCRAPED OFFICIAL WEBSITE TEXT ---\n\n" + scrapedText;
            }
        }

        console.log("🧠 Extracting full org details...");
        const prompt = `You are a strict data extraction assistant.
        Your task is to extract details for the event organizer named "${cleanName}".
        
        Source Text:
        ${extractionText}
        
        CRITICAL RULES:
        1. Extract the emails and phone numbers that belong to the organizer "${cleanName}" or its closely affiliated entities (e.g. parent company, school, foundation, directors).
        2. DO NOT extract contact info for third-party ticket platforms (like allevents, bookmyshow) or unrelated event venues.
        3. If you find contact info on corporate directories (like ZaubaCorp) or official websites related to the organizer's name, extract them.
        4. Extract the detailed physical address (area, city, etc.) if mentioned.
        5. Extract the total members count or followers count if mentioned. If you see something like "500 members" or "10k followers", convert to a number. If none, return 0.
        
        JSON Schema:
        {
          "emails": ["email1@domain.com"],
          "phones": ["+91 98765 43210"],
          "address": "Extracted address. ONLY INCLUDE the local area, street, and city. DO NOT include state, country, or pincode/zipcode. E.g. 'S.G. Highway, Ahmedabad'. If none found, return null",
          "city": "The core city name where the organizer is based (e.g. 'Ahmedabad', 'Mumbai'). If unknown, return null",
          "members_count": 500
        }`;

        const gptResponse = await openai.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.0,
            response_format: { type: "json_object" }
        });

        const rawResult = gptResponse.choices[0].message?.content || "{}";
        let parsedResult: any = { emails: [], phones: [] };
        
        try {
            parsedResult = JSON.parse(rawResult);
        } catch(e) {}

        const emails: string[] = Array.isArray(parsedResult.emails) ? parsedResult.emails.filter((e: string) => e && e.includes('@')) : [];
        const phones: string[] = Array.isArray(parsedResult.phones) ? parsedResult.phones.filter((p: string) => p && p.length > 5) : [];
        const address = parsedResult.address || undefined;
        const city = parsedResult.city || undefined;
        const members_count = typeof parsedResult.members_count === 'number' ? parsedResult.members_count : 0;
        const website = officialUrl !== "none" ? officialUrl : undefined;

        console.log(`✅ Extracted: ${emails.length} emails, ${phones.length} phones, Address: ${address}, City: ${city}, Members: ${members_count}, Website: ${website}`);
        return { emails, phones, address, city, website, members_count, facebook, instagram, youtube, linkedin };

    } catch (e: any) {
        console.error("Google Search / AI Error:", e.message);
        return emptyResult;
    }
}

// Test block if running directly
if (require.main === module) {
    const org = process.argv[2] || "Harsham Harmony Hub";
    const loc = process.argv[3] || "Ahmedabad";
    findEmailViaGoogleSearch(org, loc).then(() => process.exit(0));
}

