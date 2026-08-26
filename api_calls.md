# Hind GTM Pipeline API Flow

Here is the complete, detailed technical flow of exactly how our backend communicates with the Cohort APIs during a single pipeline run when a user inputs an event URL.

### Step 1: Create the Subcommunity (Organization)
After the AI extracts the organizer's name, email, and phone, we immediately call Cohort to create the subcommunity.

• **API Call:** `POST https://devapi.cohort.social/organization`
• **Headers:** `Authorization: Bearer <COHORT_ACCESS_TOKEN>`
• **Payload sent (FormData):**
  - `type`: "virtual"
  - `joiningMethod`: "open-signup"
  - `lockPermissionForOrganization`: "true"
  - `adminId`: "df0e077b-a203-48a3-acc1-41da79656543" (Hind Admin)
  - `name`: e.g., "GPBO Ahmedabad Business Expo 17234839300" (Appends timestamp to ensure uniqueness)
  - `contactInfo`: {"email": "contact@gpbo.org", "phoneNo": "9876543210"}
  - `philosophy`: "684ee90a-6498-4c58-a425-bdbe93886eb7"
  - `community`: "da93886c-abd8-4a71-b86c-351796dfb439"
  - `image`: A 1x1 invisible placeholder image (Cohort strictly requires an image).

• **Response Received (201 Created):**
```json
{
  "status": 201,
  "data": {
    "message": "Organization created",
    "organization": { "id": "b7c7df68-c22e-4afb-8642-62765a0fa01b" }
  }
}
```
*(We save this id in our code as `subcommunityId`)*

---

### Step 2: Fetch the Admin Invite Link
Now that the subcommunity exists, we need to grab the special invite link for the organizer.

• **API Call:** `GET https://devapi.cohort.social/invite/organization/{subcommunityId}?pageSize=10&type=custom`
• **Response Received (200 OK):** A JSON list of all available invite roles. We scan the array for `"role": "admin"`, and extract the `"link"` field.
*(We save this to our local database in the `admin_invite_link` column).*

---

### Step 3: Fetch Subcommunity Profile (For Community Name & Status)
We immediately fetch the profile of the newly created subcommunity to get its initial approval status and the name of its parent community.

• **API Call:** `GET https://devapi.cohort.social/organization/profile/{subcommunityId}`
• **Response Received (200 OK):**
```json
{
  "status": 200,
  "data": {
    "message": "Organization Profile",
    "orgDetails": {
      "isPublished": true,
      "parentCommunity": {
        "name": "Events in Ahmedabad"
      }
    }
  }
}
```
**Extraction:**
- We read `data.orgDetails.isPublished` and map it to `hindStatus` ("published" or "unpublished").
- We read `data.orgDetails.parentCommunity.name` and map it to `communityName`.

---

### Step 4: Create the Event
Now we take all the event details mapped by the AI, attach them to the `subcommunityId`, and push it to Cohort.

• **API Call:** `POST https://devapi.cohort.social/eventv2/organization/{subcommunityId}`
• **Payload sent (FormData):**
  - `title`: "GPBO Ahmedabad Business Expo 2026"
  - `date`: "2026-08-25"
  - `startTime`: "13:00:00"
  - `duration`: 240
  - `visibility`: "ORGANIZATION"
  - `isPaid`: "false"
  - `organization`: "{subcommunityId}"
  - `images`: Raw JPEG buffer of the event poster.

• **Response Received (200 OK):**
```json
{
  "status": 200,
  "data": {
    "eventDetails": {
      "id": "8f176c78-1385-4efe-bd1f-e57131f1e8da"
    }
  }
}
```
*(We extract this `id` as `eventId` and `cohort_event_id`)*

---

### Step 5: Fetch Event Status
We immediately fetch the event's profile to get its initial approval status.

• **API Call:** `GET https://devapi.cohort.social/eventv2/organization/{subcommunityId}/{eventId}/details?recording=false`
• **Response Received (200 OK):**
```json
{
  "status": 200,
  "data": {
    "eventDetails": {
      "approvalStatus": "published",
      "isPublished": true
    }
  }
}
```
**Extraction:**
- We check `approvalStatus`. If it is `"approved"`, we map the event's `hindStatus` to `"published"`. Otherwise, we map it to `"unpublished"`.

---

### Step 6: Final Database Assembly
Our backend does the final clean-up locally:

1. **Build the Hind Event URL:**
   `https://turbo.cohort.social/community/da93886c-abd8-4a71-b86c-351796dfb439/organisation/{subcommunityId}/events/{eventId}`
2. **Database Save:** It takes all the fetched variables (`communityName`, `hindStatus`, `adminInviteLink`, `hind_url`, `cohort_event_id`) and updates the `organizations` and `events` Postgres tables.

---

### Sync API Flow (`POST /api/sync-all`)
When the user clicks the "Refresh" (Sync) button on the dashboard:
1. Backend loops through all organizations with a `subcommunityId`.
2. Calls **Step 3 API** (`GET /organization/profile/{subcommunityId}`) to get the latest `isPublished` and `parentCommunity.name`. Updates DB.
3. Loops through all events belonging to that organization.
4. Calls **Step 5 API** (`GET /eventv2/organization/.../details`) to get the latest `approvalStatus`. Updates DB.
5. Frontend silently reloads data.

Here is the exact, step-by-step process of what happens intelligently behind the scenes
  after that search query is sent to Google:
  ### Step 1: Gathering All Text Snippets

  When the Serper API responds, it doesn't just give us a list of links. It gives us a JSON
  file containing all the text that appeared on the Google Search page. The backend pulls
  text from 3 specific places:
  1. The Answer Box / AI Overview: If Google's AI generated a direct answer at the top of
  the page, we grab that full text.
  2. The Knowledge Graph: If Google showed a company info panel on the right side, we grab
  that description.
  3. Organic Snippets: We grab the Title and the 2-line text snippet underneath every single
  link on the first page of Google.

  ### Step 2: Discovering the Official Website (AI Pass #1)
  The backend bundles all those text snippets together and sends them to GPT-4o-mini. It
  asks the AI: "Read these Google search results and find the official website for this
  organizer. Ignore directories like Facebook or BookMyShow."
  If the AI finds a real website, our backend actually goes to that website, reads the
  homepage, and automatically navigates to their "Contact" and "About" pages to scrape all
  the raw text from them!

  ### Step 3: Strict Data Extraction (AI Pass #2)
  Finally, the backend takes everything it gathered (the Google AI Overviews, the Knowledge
  Graph, the Search Snippets, and all the raw text from the official website if it found
  one) and feeds it back into GPT-4o-mini one last time.

  It gives the AI a massive wall of text along with the new strict rules we just wrote:

  │ "Read all of this text. Find the phone numbers, emails, and physical address. You must
  │ strictly verify that the contact info belongs explicitly to the organizer. If you aren't
  │ 100% sure, skip it."

  The AI acts like a human reading through the research. It ignores the random numbers,
  finds the true contact details, and returns them to the backend in a clean JSON format,
  which is then saved to your database!

  Here is the exact comparison breakdown of how it works right now:

  ### 1. Main Table (Subcommunity)

  When you select "Ahmedabad" in the dropdown, the frontend looks at the Address Column of
  every Subcommunity.
  If the Organizer's base city is Ahmedabad, it keeps that row on your screen. If the
  Organizer is based in Delhi, it hides them.
  ### 2. Events Sub-Table (Location Column)

  If you click "View" to open the Events Sub-Table for that Ahmedabad subcommunity, the
  frontend now looks at the Location Column of every single event they have.

  • It finds their Ahmedabad event and shows it!
  • It finds their Mumbai event and hides it (because the dropdown is currently set to
  Ahmedabad).

  ### 3. Contacts Sub-Table

  When you click "View" to open Contacts, it shows ALL contacts for that subcommunity
  (because contacts don't have a specific event location).

  This is exactly how you requested it to work, and it is fully active right now. 🚀 If you
  run a new scrape, you will see everything filter flawlessly based on the new Data
  Structure!