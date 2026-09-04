const fs = require('fs');
let content = fs.readFileSync('scraping_Architecture.md', 'utf-8');

const dbReplacement = `### B. Modifications to pending_scrapes
- Add a new column: linked_org_id (UUID, nullable).
- If an event is pre-linked by the automation or manually linked by the user, this column holds the target organization ID.

### C. Modifications to organizations (Rich Data Persistence)
- Add a new column: \`rich_data\` (JSONB).
- When a completely new organization is scraped and approved, its entire suite of rich assets (logos, images, amenities, features, payments, accessibility, google business links, full descriptions) are permanently stored into this JSONB column. 
- This enables the frontend to instantly display the exact, fully-formed profile of existing organizations without making slow, external API calls to Cohort.`;

content = content.replace(/### B\. Modifications to pending_scrapes[\s\S]*?(?=\n---\n)/, dbReplacement);

const uiReplacement = `### C. The "Org Details" View (Dynamic & Locked Mode)
The existing "View" button for Org Details heavily adapts based on the link status:
- **If Linked (linked_org_id is set):** The form is pre-filled **exclusively** with the existing organization's \`rich_data\` (including the existing logo, images, features, description). Crucially, the entire form **locks into a read-only mode** (all inputs and upload buttons become disabled). Because this organization already exists and is perfected in our database, it cannot be accidentally edited while approving a new event.
- **If Unlinked (New Org):** The form shows the newly scraped, raw data from the current event and remains completely editable.`;

content = content.replace(/### C\. The "Org Details" View \(Dynamic Behavior\)[\s\S]*?(?=### D\. Breaking the Link)/, uiReplacement);

fs.writeFileSync('scraping_Architecture.md', content, 'utf-8');
console.log("Updated scraping_Architecture.md");
