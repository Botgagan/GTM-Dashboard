const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const badLogic = `    // 2. Fetch the correct original payload using the sourceUrl
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
    let updatedAddress = p.locationStr;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;`;

const goodLogic = `    // 2. Fetch the correct original payload using the sourceUrl
    const pendingRes = await pool.query("SELECT payload FROM pending_scrapes WHERE source_url = $1 LIMIT 1", [sourceUrl]);
    
    let p = null;
    let mappedEventData = null;
    if (pendingRes.rows.length > 0) {
        p = pendingRes.rows[0].payload;
        mappedEventData = p.mappedEventData || p;
    }
    
    // 3. Get fresh details from Cohort GET API to overwrite our local data
    const apiClient = await import('./apiClient');
    let apiData = null;
    try {
        apiData = await apiClient.getSubcommunityDetails(manualOrgId);
    } catch (e) {
        console.error("Warning: Failed to fetch fresh details from Cohort API", e);
    }

    // Use existing DB name as fallback if payload is missing
    const orgRes = await pool.query('SELECT name, city FROM organizations WHERE id = $1', [localOrgId]);
    
    let updatedName = p ? p.primaryOrganizer : orgRes.rows[0].name;
    let updatedWebsite = null;
    let updatedCity = p ? p.locationStr : orgRes.rows[0].city;
    let updatedAddress = p ? p.locationStr : orgRes.rows[0].city;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;`;

const badPushLogic = `    // 5. Submit Event to Cohort API
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
    );`;

const goodPushLogic = `    // 5. Submit Event to Cohort API (ONLY IF PAYLOAD EXISTS)
    if (mappedEventData) {
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
    } else {
        console.log("Skipping event push because original payload was deleted from pending_scrapes.");
    }`;

content = content.replace(badLogic, goodLogic);
content = content.replace(badPushLogic, goodPushLogic);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Refactored retryManualOrg to gracefully handle missing payloads");
