import { processUrl } from "./pipeline";

async function main() {
    console.log("Starting Full Hind Social Automation Pipeline with APIFY PLAYWRIGHT & HYBRID GPT-4O-MINI...");
    
    try {
        const TARGET_URLS = [
            "https://allevents.in/ahmedabad/french-cin%C3%A9club-de-grandes-esp%C3%A9rances-tickets/80003408605273"
        ];
        
        for (const targetUrl of TARGET_URLS) {
            await processUrl(targetUrl);
        }
        
        console.log(`\n🎉 BATCH PROCESSING COMPLETE!`);
        process.exit(0);

    } catch (error) {
        console.error("Pipeline failed:", error);
        process.exit(1);
    }
}

main();

