const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

// Replace approveWithManualOrg with retryManualOrg
const oldFunc = `export async function approveWithManualOrg(pendingId: string, manualOrgId: string) {`;
const newFunc = `export async function retryManualOrg(localOrgId: string, manualOrgId: string) {
    const { pool, getAdminInviteLink, getSubcommunityDetails, submitEventToCohortApi, getEventDetails } = await import('./db');
    const { updateOrganization, insertEvent } = await import('./db');
    
    // 1. Fetch the local organization to get its name
    const orgRes = await pool.query('SELECT * FROM organizations WHERE id = $1', [localOrgId]);
    if (orgRes.rows.length === 0) throw new Error("Local organization not found");
    const localOrg = orgRes.rows[0];

    // 2. Try to find the original pending_scrapes payload using the org name
    const pendingRes = await pool.query("SELECT payload FROM pending_scrapes WHERE payload::jsonb->>'primaryOrganizer' = $1 LIMIT 1", [localOrg.name]);
    let mappedEventData = null;
    let targetUrl = "";
    let fullStartTimestamp = null;
    let finalLocation = null;
    let eventTitle = null;

    if (pendingRes.rows.length > 0) {
        const p = typeof pendingRes.rows[0].payload === 'string' ? JSON.parse(pendingRes.rows[0].payload) : pendingRes.rows[0].payload;
        mappedEventData = p.mappedEventData;
        targetUrl = p.targetUrl;
        fullStartTimestamp = p.fullStartTimestamp;
        finalLocation = p.finalLocation;
        eventTitle = p.eventTitle;
    }

    console.log(\`Resuming scrape for: \${localOrg.name} using manual subcommunity ID: \${manualOrgId}\`);

    // 3. Fetch admin invite link and details from Cohort
    const api = await import('./apiClient');
    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    
    const fetchedLink = await api.getAdminInviteLink(manualOrgId);
    if (fetchedLink) adminInviteLink = fetchedLink;

    const detailsData = await api.getSubcommunityDetails(manualOrgId);
    if (detailsData && detailsData.orgDetails) {
        const isPub = detailsData.orgDetails.isPublished;
        orgApprovalStatus = isPub ? 'published' : 'unpublished';
        if (detailsData.orgDetails.parentCommunity && detailsData.orgDetails.parentCommunity.name) {
            parentCommunityName = detailsData.orgDetails.parentCommunity.name;
        }
    }

    // 4. Update the local organization
    await updateOrganization(localOrgId, {
        name: localOrg.name,
        community_name: parentCommunityName || localOrg.community_name,
        created_for: localOrg.created_for,
        owner: localOrg.owner,
        members_count: localOrg.members_count,
        org_name: localOrg.org_name,
        city: localOrg.city,
        address: localOrg.address,
        website: localOrg.website,
        status: 'unclaimed',
        hind_status: orgApprovalStatus,
        admin_invite_link: adminInviteLink !== "Not Generated" ? adminInviteLink : undefined
    });

    // We also need to update the subcommunity_id and clear failure_reason directly since updateOrganization doesn't expose them
    await pool.query(
        'UPDATE organizations SET subcommunity_id = $1, failure_reason = NULL WHERE id = $2',
        [manualOrgId, localOrgId]
    );

    // 5. If we found the event payload, push it to Cohort
    if (mappedEventData) {
        let newEventId = "";
        let eventUrl = "";
        let approvalStatus = "pending";

        try {
            const apiResponse: any = await api.submitEventToCohortApi(mappedEventData, manualOrgId);
            const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
            newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
            eventUrl = \`https://turbo.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/\${manualOrgId}/events/\${newEventId}\`;

            if (newEventId) {
                const freshEventDetails = await api.getEventDetails(manualOrgId, newEventId);
                if (freshEventDetails && freshEventDetails.approvalStatus) {
                    approvalStatus = freshEventDetails.approvalStatus === 'approved' ? 'published' : 'unpublished';
                }
            }

            // Save Event in DB
            await insertEvent({
                orgId: localOrgId,
                title: eventTitle,
                description: mappedEventData.description,
                startDate: fullStartTimestamp,
                location: finalLocation,
                url: targetUrl,
                cohortEventId: newEventId,
                cohortEventUrl: eventUrl,
                hindStatus: approvalStatus
            });
        } catch(e: any) {
            console.error("Failed to push event data during manual retry:", e.message);
        }
    }
}
export async function DUMMY`;

content = content.replace(/export async function approveWithManualOrg[\s\S]*?(?=export async function approvePendingScrape|$)/, newFunc);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts with retryManualOrg");
