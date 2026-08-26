const scrapedEvent = require('fs').readFileSync('test-scrape.js'); // wait, I don't have scrapedEvent.
// Let me just test the regex on exactly this string:
const rawHtml = 'mber","startDate":"2026-09-07T12:30:00.000Z","endDate":"2026-10-0';
const startDateMatch = rawHtml.match(/"startDate"\s*:\s*"([^"]+)"/i);
let extractedStartDate = startDateMatch ? startDateMatch[1] : null;
console.log("Extracted:", extractedStartDate);
if (extractedStartDate) {
    const startUtc = new Date(extractedStartDate);
    const startTime = startUtc.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    console.log("startTime:", startTime);
}
