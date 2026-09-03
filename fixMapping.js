const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldRetryFuncStart = `export async function retryManualOrg(localOrgId: string, manualOrgId: string) {`;

// Find where retryManualOrg ends
const startIndex = content.indexOf(oldRetryFuncStart);
const endIndex = content.indexOf('\n}', startIndex) + 2;

const newRetryFunc = `export async function retryManualOrg(localOrgId: string, manualOrgId: string) {
    const { pool, updateOrganization } = await import('./db');
    
    // 1. Fetch the exact failed event for this org to guarantee we get the correct sourceUrl
    const failedEventRes = await pool.query("SELECT * FROM events WHERE org_id = $1 AND status = 'failed' LIMIT 1", [localOrgId]);
    if (failedEventRes.rows.length === 0) {
        throw new Error("Could not find the failed event record for this organization");
    }
    const failedEvent = failedEventRes.rows[0];
    const sourceUrl = failedEvent.source_url;

    // 2. Fetch the correct original payload using the sourceUrl
    const pendingRes = await pool.query("SELECT payload FROM pending_scrapes WHERE source_url = $1 LIMIT 1", [sourceUrl]);
    if (pendingRes.rows.length === 0) {
        throw new Error("Could not find original scrape payload for source: " + sourceUrl);
    }
    
    const p = pendingRes.rows[0].payload;
    const mappedEventData = p.mappedEventData || p;
    
    // 3. Get fresh details from Cohort GET API to overwrite our local data
    const apiClient = await import('./apiClient');
    let apiData = null;
    try {
        apiData = await apiClient.getSubcommunityDetails(manualOrgId);
    } catch (e) {
        console.error("Warning: Failed to fetch fresh details from Cohort API", e);
    }

    let updatedName = p.primaryOrganizer;
    let updatedWebsite = null;
    let updatedCity = p.locationStr;
    
    if (apiData && apiData.details) {
        if (apiData.details.name) updatedName = apiData.details.name;
        if (apiData.details.website) updatedWebsite = apiData.details.website;
        // Map location if available, otherwise keep scraped city
        if (apiData.details.location) updatedCity = apiData.details.location;
        
        // Handle Contacts (email/phone) mapping
        const email = apiData.details.email;
        const phone = apiData.details.phoneNo;
        
        if (email && email.indexOf('@placeholder.com') === -1) {
            await pool.query("INSERT INTO contacts (org_id, email, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, email]);
        }
        if (phone) {
            await pool.query("INSERT INTO contacts (org_id, phone, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, phone]);
        }
    }

    // 4. Update the organization in our local DB with the fresh API data!
    await updateOrganization(localOrgId, {
        subcommunityId: manualOrgId,
        name: updatedName,
        orgName: updatedName,
        website: updatedWebsite,
        city: updatedCity,
        failureReason: null,
        status: 'unclaimed'
    });

    // 5. Submit Event to Cohort API
    let newEventId = "";
    let eventUrl = "";
    let approvalStatus = "pending";

    const apiResponse: any = await apiClient.submitEventToCohortApi(mappedEventData, manualOrgId);
    const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
    newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
    eventUrl = \`https://turbo.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/\${manualOrgId}/events/\${newEventId}\`;

    if (newEventId) {
        const freshEventDetails = await apiClient.getEventDetails(manualOrgId, newEventId);
        if (freshEventDetails && freshEventDetails.approvalStatus) {
            approvalStatus = freshEventDetails.approvalStatus === 'approved' ? 'published' : 'unpublished';
        }
    }

    // 6. UPDATE the existing failed event instead of inserting a duplicate!
    await pool.query(
        "UPDATE events SET status = $1, cohort_event_id = $2, hind_url = $3, hind_status = $4 WHERE id = $5",
        ['new', newEventId, eventUrl, approvalStatus, failedEvent.id]
    );

    // 7. Generate Admin Invite Link
    try {
        const adminInviteLink = await apiClient.getAdminInviteLink(manualOrgId);
        if (adminInviteLink && adminInviteLink !== "Not Generated") {
            await updateOrganization(localOrgId, { adminInviteLink });
        }
    } catch(e) { console.error("Failed to fetch admin link on manual retry"); }

    console.log(\`??? Manual Organization Link Successful!\`);
}
`;

content = content.substring(0, startIndex) + newRetryFunc + content.substring(endIndex);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Refactored retryManualOrg successfully");
