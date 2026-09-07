# Complete Hind GTM Pipeline & Scraping Architecture

This document contains the complete technical flow, API lifecycle, data mapping schema, and scraping architecture for the Hind GTM Pipeline. Use this to understand exactly what happens under the hood from the moment a URL is processed to the final data appearing in the dashboard.

## 1. The Core Architecture & Philosophy

### A. "Human-in-the-loop Auto-Linking"
Instead of blindly pushing scraped events to existing organizations, the automation **suggests** links. These pre-linked events sit in the **Scraped Events** tab, giving the admin full control to approve, re-link, or break the link before anything is pushed to the live Cohort platform.

### B. The Database Architecture
1. **Organization Aliases (\organization_aliases\)**: Stores historical name mappings to prevent duplicate subcommunities.
2. **Pending Scrapes (\pending_scrapes\)**: Holds events waiting for approval. Uses \linked_org_id\ to track suggested or manual linkages to existing organizations.
3. **Organizations (\organizations\)**: Stores the final, approved organizations with a \
ich_data\ JSONB column holding permanent assets (logos, images, amenities, facebook, instagram, youtube, descriptions).

---

## 2. The Complete Data Flow & API Lifecycle

When an event URL is processed or an event is approved, here is the exact chronological sequence of API calls to the Cohort platform and the Google Serper API.

### Phase 1: Data Gathering & Mapping (Before Approval)

**1. Scraping & AI Mapping**
- The backend scrapes the event URL (e.g., Eventbrite, SortMyScene).
- GPT-4o-mini maps the raw text into a strict \mappedEventData\ schema (Title, Date, Time, Location, Description, etc.).

**2. Discovering the Official Website & Social Links (Serper API)**
- **API Call:** \POST https://google.serper.dev/search\
- **Payload:** \{ "q": "<Organizer Name> <City>", "gl": "in" }\
- The backend parses the top 10 organic results.
- A fast JS filter extracts \acebook\, \instagram\, and \youtube\ profile links directly from these top 10 URLs.
- The top 10 snippets are passed to GPT-4o-mini to identify the official website.
- If a website is found, it is scraped for further contact info (Emails, Phones, Address, Members count).

### Phase 2: Execution Flow (Upon Approval)

When an admin clicks **Approve** in the dashboard, the backend communicates with Cohort.

#### Step 1: Create the Subcommunity (Organization)
� **API Call:** \POST https://devapi.cohort.social/organization\
� **Headers:** \Authorization: Bearer <COHORT_ACCESS_TOKEN>\
� **Payload Sent (FormData):**
  - \	type\: "virtual"
  - \joiningMethod\: "open-signup"
  - \lockPermissionForOrganization\: "true"
  - \dminId\: "df0e077b-a203-48a3-acc1-41da79656543" (Hind Admin)
  - \
ame\: Organizer Name + Timestamp (to ensure uniqueness)
  - \contactInfo\: \{"email": "...", "phoneNo": "..."}\
  - \philosophy\: "684ee90a-6498-4c58-a425-bdbe93886eb7"
  - \community\: "da93886c-abd8-4a71-b86c-351796dfb439"
  - \image\: A 1x1 invisible placeholder image.
� **Response (201 Created):** Returns \organization.id\ (saved as \subcommunityId\).

#### Step 2: Fetch the Admin Invite Link
� **API Call:** \GET https://devapi.cohort.social/invite/organization/{subcommunityId}?pageSize=10&type=custom\
� **Response (200 OK):** A list of invite roles. We extract the link where \"role": "admin"\.

#### Step 3: Fetch Subcommunity Profile
� **API Call:** \GET https://devapi.cohort.social/organization/profile/{subcommunityId}\
� **Response (200 OK):** Returns \orgDetails.isPublished\ and \orgDetails.parentCommunity.name\.

#### Step 4: Create the Event
� **API Call:** \POST https://devapi.cohort.social/eventv2/organization/{subcommunityId}\
� **Payload Sent (FormData):**
  - \title\: Event Title
  - \date\: "YYYY-MM-DD"
  - \startTime\: "HH:MM:SS"
  - \duration\: e.g., 240
  - \isibility\: "ORGANIZATION"
  - \isPaid\: "false"
  - \organization\: "{subcommunityId}"
  - \images\: Raw JPEG buffer of the event poster.
� **Response (200 OK):** Returns \eventDetails.id\ (saved as \eventId\ / \cohort_event_id\).

#### Step 5: Fetch Event Status
� **API Call:** \GET https://devapi.cohort.social/eventv2/organization/{subcommunityId}/{eventId}/details?recording=false\
� **Response (200 OK):** Returns \eventDetails.approvalStatus\ (mapped to \hindStatus\).

#### Step 6: Final Database Assembly
- **Hind Event URL:** \https://turbo.cohort.social/community/{communityId}/organization/{subcommunityId}/events/{eventId}\
- **Database Save:** Updates local \organizations\ and \events\ Postgres tables with all fetched variables and the rich JSON data (including the new social media links).

---

## 3. Data Schema & UI Mapping

### The \
rich_data\ Schema (Organizations)
When an organization is saved, its permanent assets are stored in the \
rich_data\ JSONB column:
`json
{
  "logo": "url_string",
  "images": ["url_string"],
  "accessibility": ["string"],
  "offerings": ["string"],
  "amenities": ["string"],
  "payments": ["string"],
  "description": "Full text description",
  "googleBusinessLink": "url_string",
  "facebook": "url_string",
  "instagram": "url_string",
  "youtube": "url_string"
}
`

### The Master Filter Logic (City Filtering)
- The database enforces strict location filtering using a dedicated \city\ column on the \events\ table.
- When filtering by City in the frontend, the backend executes an \ILIKE\ query strictly against \contactInfo.city\ (for pending scrapes) and \events.city\ (for approved events), completely ignoring the raw venue/address string to guarantee 100% accurate results.
- In the frontend UI, the Location column cleanly stacks the exact City Name on top in bold, with the Venue/Full Address stacked below it in muted text.




## 4. Master Filter Logic (City Filtering)
**When does a city appear in the Master Filter dropdown?**
- Currently, a city is added to the Master Filter dropdown **AFTER an event is approved**. 
- The backend API (`/api/cities`) specifically scans the database's `events` table for unique cities. Because an event only moves into the `events` table after an admin clicks "Approve" (pushing it to Cohort), a newly discovered city in the "Scraped Events" tab won't appear in the dropdown until at least one event from that city is officially approved.
- If the event is marked as "Online", it is seamlessly added to the Master Filter dropdown as "Online", allowing you to easily filter and view all approved virtual/online events.

---



### How the Cascading City Filter Works (e.g. "Mumbai")
When a city is selected from the Master Filter, a cascading logic applies across the entire dashboard:
1. **Frontend Trigger:** The `cityFilter` React state updates, appending `?city=Mumbai` to all dashboard API requests.
2. **Scraped Events Tab:** 
   - API: `GET /api/pending?city=Mumbai`
   - DB Logic: Queries `WHERE payload::jsonb -> 'contactInfo' ->> 'city' ILIKE '%Mumbai%'`.
   - Result: Only scraped events strictly located in Mumbai are displayed.
3. **Organizations Tabs (Claimed / Unclaimed / Failed):** 
   - API: `GET /api/organizations?city=Mumbai`
   - DB Logic: Joins `organizations` with `events`, filtering by `WHERE e.city ILIKE '%Mumbai%'` with a `HAVING COUNT > 0` condition.
   - Result: Only organizations that are hosting at least one event in Mumbai are displayed.
4. **Nested Events Sub-Table:**
   - API: `GET /api/org/{id}/events?city=Mumbai`
   - DB Logic: Queries `WHERE org_id = {id} AND city ILIKE '%Mumbai%'`.
   - Result: When viewing a specific organization's events, events from other cities are hidden, displaying exclusively their Mumbai events.

## 5. Technology Stack & Services Used

**Frontend:**
- React (Vite)
- Tailwind CSS
- Shadcn UI (Radix Primitives)
- Lucide React (Icons)

**Backend:**
- Node.js & Express.js
- TypeScript
- PostgreSQL (Database, via `pg` library)
- Multer (File uploads handling using cloudinary)

**AI & Third-Party Services:**
- **OpenAI (GPT-4o-mini):** Used for mapping raw scraped text into structured Event schemas and for extracting precise contact information from Google Search results.
- **Serper (Google Search API):** Used to perform real-time Google searches to find the organizer's official website and social media (Facebook, Instagram, YouTube).
- **Cohort API:** The proprietary backend API where organizations, invite links, and events are pushed.
- **Instantly API:** Used for pushing extracted leads for automated cold email outreach.
- **Apify:** (Integrated/Planned) Used for scheduled, cloud-based scraping of platforms like Eventbrite and SortMyScene.
