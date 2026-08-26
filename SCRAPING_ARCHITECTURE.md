# Automated Scraping Architecture & Design Document

This document outlines the end-to-end architecture of the automated daily event scraping engine, the tools utilized, and the specific design decisions regarding concurrency, batching, and webhook avoidance.

## 1. High-Level Flow (The Daily 10:00 AM Cron Job)

The entire automated system is orchestrated by a `node-cron` job running inside the Node.js Express backend. At 10:00 AM every day, the `discoveryEngine.ts` script wakes up and performs the following sequence:

1. **Platform Query:** Queries the `scraping_platforms` PostgreSQL table to find all active platforms (e.g., Eventbrite, Townscript, AllEvents).
2. **URL Discovery (Serper API):** Instead of using a crawler to navigate homepages, the engine queries the **Google Serper API** (Google Search). 
   - *Query format:* `site:townscript.com/e/ "2026"` with time filters (`qdr:d` for past 24 hours) and geolocation (`gl:in` for India).
   - *Why?* Google has already bypassed bot protection and indexed the internet. This allows us to instantly discover fresh event URLs without writing custom, fragile page-navigation crawlers for 7 different websites.
3. **Queueing (Database):** The engine grabs exactly 2 URLs per active platform (up to 14 total) and inserts them into the `scraped_urls_history` database table with a status of `pending`/`processing`.
4. **Batch Extraction (Apify):** The engine takes all 14 URLs and pushes them as a single array (`startUrls`) into **ONE** Apify Playwright Actor run.
5. **LLM Mapping & Final Storage:** Apify returns an array of 14 scraped HTML payloads. The engine loops through this array, passes the text to the LLM mapper (`openai/gpt-4o-mini`) to extract structured event and organizer details, and inserts the final JSON into the `pending_scrapes` database table. The URL status in `scraped_urls_history` is marked as `success`.
6. **Frontend Review:** The user opens the frontend **Scraped Events** tab, reviews the data in `pending_scrapes`, and clicks "Approve" (which moves the data to the permanent `events` and `organizations` tables) or "Reject".

## 2. Database Schema Interactions

The automated pipeline relies heavily on the PostgreSQL database to act as the source of truth and the queuing mechanism.

*   `scraping_platforms`: Stores the base domain and search string for the 7 supported platforms. Features an `is_active` boolean toggle so platforms can be disabled from the UI.
*   `scraped_urls_history`: Acts as the native persistent queue. It tracks every discovered URL, its associated platform, discovery timestamp, and processing status (`processing`, `success`, `failed`). This guarantees that if the server crashes, no URLs are lost.
*   `pending_scrapes`: The staging area. Once the LLM perfectly maps the event details, it lands here waiting for human approval.

## 3. Concurrency Strategy: Apify Request Queues

Instead of utilizing heavy local queuing infrastructure like BullMQ, Redis, or `p-limit`, we leverage **Apify's Request Queue (AutoscaledPool)**.

*   **The Inefficient Way (Individual Actors):** If the backend triggered Apify individually for all 14 URLs, we would pay the Apify container "boot-up" overhead fee 14 separate times. The server would also be managing 14 separate network connections.
*   **Our Optimized Way (Batching):** By passing all 14 URLs to the `apify/playwright-scraper` in a single array (`startUrls`), Apify boots up exactly **one** container. Inside that cloud container, Apify dynamically opens multiple Playwright browser tabs (usually 2 to 5 at a time) depending on the available RAM. It scrapes all 14 URLs concurrently and returns a single array of results.
*   **Result:** Maximum cost savings, native retry capabilities (handled by Apify), and near-zero load on the local Node.js server.

## 4. Architectural Decision: "Await" vs. "Webhook"

When triggering an Apify batch run, there are two primary architectures:
1.  **Await Architecture:** The Node.js server sends the job to Apify and keeps the asynchronous connection open (`await client.actor.call()`), waiting for the results to come back.
2.  **Webhook (Fire-and-Forget) Architecture:** The Node.js server sends the job to Apify and immediately hangs up (`client.actor.start()`). When Apify finishes 5 minutes later, it makes an HTTP POST request back to a public endpoint on the Node.js server containing the data.

**Why we explicitly chose the Await Architecture:**

*   **Node.js is Non-Blocking:** Awaiting a promise in Node.js does not consume CPU resources. The cron job thread simply sits in memory sleeping while Apify works. Because this is a persistent Express server (not a Serverless function like AWS Lambda/Vercel that times out), an idle 5-minute connection is completely harmless.
*   **Scale:** We are scraping ~14 to 30 URLs per day. A Webhook architecture is designed for massive enterprise jobs (e.g., 50,000 URLs running for 12 hours) where keeping a connection open is impossible.
*   **Architectural Simplicity:** Implementing a Webhook requires exposing a secure, public `/api/webhook` route to the internet, handling network retries, and restructuring the entire LLM-mapping logic to execute independently of the cron job. 
*   **Conclusion:** By utilizing the `await` architecture, we achieve 100% of the cost-saving and concurrency benefits of the Apify batch run, while retaining a drastically simpler, cleaner, and strictly sequential local codebase.
