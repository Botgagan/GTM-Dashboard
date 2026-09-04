# Scraping Architecture: Organization Deduplication & Auto-Linking

## The Challenge
Events are scraped daily from multiple platforms (Eventbrite, SortMyScene, MeraEvents, etc.). A single real-world organization (e.g., "Wafflelogy") might exist under slightly different names on different platforms (e.g., "Wafflelogy Cafe", "Wafflelogy India").
We need a robust system that:
1. Prevents duplicate subcommunities from being created on the Cohort platform.
2. Learns from manual user actions to auto-link future events.
3. Keeps a "Human-in-the-Loop" safeguard so automation mistakes can be caught and corrected before pushing to Cohort.

## Core Philosophy: "Human-in-the-loop Auto-Linking"
Instead of blindly pushing events to existing organizations, automation will **suggest** links. These pre-linked events will still sit in the Scraped Events tab, giving the admin full control to approve, re-link, or break the link before anything is pushed to the live Cohort platform.

---

## 1. The Database Architecture

### A. The Alias Dictionary (organization_aliases)
A new table will be created to store historical name mappings.
- id (UUID)
- org_id (Foreign Key -> organizations.id)
- lias_name (String: The exact scraped name, e.g., "Wafflelogy Cafe")
- platform (String: The source platform, e.g., "sortmyscene")

*How it works:* The dictionary primarily relies on exact, deterministic mapping created by manual user actions. When the exact alias is found in the database, it requires zero compute.

### B. Modifications to pending_scrapes
- Add a new column: linked_org_id (UUID, nullable).
- If an event is pre-linked by the automation or manually linked by the user, this column holds the target organization ID.

### C. Modifications to organizations (Rich Data Persistence)
- Add a new column: `rich_data` (JSONB).
- When a completely new organization is scraped and approved, its entire suite of rich assets (logos, images, amenities, features, payments, accessibility, google business links, full descriptions) are permanently stored into this JSONB column. 
- This enables the frontend to instantly display the exact, fully-formed profile of existing organizations without making slow, external API calls to Cohort.
---

## 2. The Daily Scraping Pipeline (The "Learning" Automation)

When a new event is downloaded (e.g., organizer "Wafflelogy Cafe"), the pipeline runs a 2-Step matching engine:

1. **Deterministic Match (Database Alias Check):** It checks the organization_aliases table for an exact string match. If found, it links immediately.
2. **Semantic Entity Resolution (LLM Check):** If no exact match is found, the pipeline passes the scraped name alongside existing database organizations to GPT-4o-mini. The LLM understands context and nuance (e.g., knowing that "Wafflelogy India" and "Wafflelogy Pvt Ltd" are semantically the same entity). If the LLM is highly confident in a match, it pre-links it.

*Result:* The event is placed in the Scraped Events tab for review.

---

## 3. The Frontend (Scraped Events UI)

### A. The "Link Status" Indicator
- A new column is added to the Scraped Events table.
- **Green Badge:** "Linked to: [Existing Org Name]" (Appears if linked_org_id is populated).
- **Gray Badge:** "New Organization" (Appears if linked_org_id is null).

### B. The Manual Search & Link Action
- An action button (Search Icon) is added to each row.
- Clicking it opens a **Shadcn Dialog containing a Shadcn Command/Combobox component**.
- **Real-time Search:** As soon as the user types the very first letter (e.g., "W"), the Combobox instantly filters the list of existing organizations (fetching from both **Unclaimed** and **Claimed** tabs).
- Selecting an organization instantly updates the linked_org_id for that event in the database, and the page refreshes to reflect the new link status.

### C. The "Org Details" View (Dynamic & Locked Mode)
The existing "View" button for Org Details heavily adapts based on the link status:
- **If Linked (linked_org_id is set):** The form is pre-filled **exclusively** with the existing organization's `rich_data` (including the existing logo, images, features, description). Crucially, the entire form **locks into a read-only mode** (all inputs and upload buttons become disabled). Because this organization already exists and is perfected in our database, it cannot be accidentally edited while approving a new event.
- **If Unlinked (New Org):** The form shows the newly scraped, raw data from the current event and remains completely editable.### D. Breaking the Link (Error Correction)
If the automation makes a mistake and links an event to the wrong organization:
- The user opens the "Org Details" view.
- The user edits the fields (e.g., changes the name to a brand new organization).
- Doing this automatically breaks the link (sets linked_org_id = null), treating it as a brand new organization.

---

## 4. The Approval Execution (pprovePendingScrape)

When the user clicks **Approve** on a row in the Scraped Events tab:

**Scenario A: It IS linked (linked_org_id is not null)**
1. **Push Event:** The backend fetches the subcommunity_id of the linked organization and pushes the event directly to that Cohort Subcommunity.
2. **Train AI:** The backend inserts the scraped organizer name into the organization_aliases table to ensure future events with this exact name are auto-linked via Step 1 (saving LLM costs).
3. **Save Local:** The event is saved in the local events table with the existing org_id.
4. **Dashboard Update:** The existing organization (whether it sits in the **Unclaimed** OR **Claimed** tab) gets a +1 to its event count. The actual event is appended to that organization, so when a user clicks "View" under Events, the new event will show up there with all its details.

**Scenario B: It is NOT linked (linked_org_id is null)**
1. **Standard Flow:** The backend creates a brand new Subcommunity on Cohort.
2. **Push Event:** The event is pushed to the newly created Subcommunity.
3. **Save Local:** A new organization row is created in the local database and moved to the Unclaimed Communities tab.
4. **Train AI:** The scraped name is recorded in organization_aliases tied to this newly created organization.

---

## Summary of User Actions
1. **Approve Pre-linked Event:** Click Approve. Event goes to the existing org. System gets smarter.
2. **Change Pre-linked Event:** Click Search, instantly find a different Unclaimed/Claimed org via Shadcn Combobox. Form updates. Click Approve. Event goes to the newly chosen org.
3. **Reject Pre-linked Event:** Open Org Details, edit the name to create a new org. Click Approve. Event creates a brand new org.
