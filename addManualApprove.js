const fs = require('fs');
let pipelineContent = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const newFunction = `
export async function approveWithManualOrg(pendingId: string, manualOrgId: string) {
    const { getPendingScrapeById, insertContact, insertEvent, upsertOrganization, updatePendingScrapeStatus } = await import('./db');
    const row = await getPendingScrapeById(pendingId);
    if (!row) throw new Error("Pending scrape not found");

    const p = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    const {
        mappedEventData,
        targetUrl,
        primaryOrganizer,
        contactInfo,
        fullStartTimestamp,
        finalLocation,
        eventTitle
    } = p;

    console.log(\`Resuming scrape for: \${eventTitle} using manual subcommunity ID: \${manualOrgId}\`);

    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    
    // Instead of creating, we just fetch the link and details
    const fetchedLink = await getAdminInviteLink(manualOrgId);
    if (fetchedLink) adminInviteLink = fetchedLink;

    const detailsData = await getSubcommunityDetails(manualOrgId);
    if (detailsData && detailsData.orgDetails) {
        const isPub = detailsData.orgDetails.isPublished;
        orgApprovalStatus = isPub ? 'published' : 'unpublished';
        if (detailsData.orgDetails.parentCommunity && detailsData.orgDetails.parentCommunity.name) {
            parentCommunityName = detailsData.orgDetails.parentCommunity.name;
        }
    }

    // DB: Save organization
    const orgId = await upsertOrganization({
        name: primaryOrganizer,
        status: 'unclaimed',
        city: contactInfo.city || p.locationStr,
        address: contactInfo.address,
        website: contactInfo.website,
        membersCount: contactInfo.members_count,
        createdFor: "event", 
        owner: "hind admin", 
        communityName: parentCommunityName, 
        subcommunityId: manualOrgId,
        adminInviteLink: adminInviteLink !== "Not Generated" ? adminInviteLink : undefined,
        failureReason: undefined,
        hindStatus: orgApprovalStatus
    });

    // DB: Save contacts
    for (const email of contactInfo.emails) {
        await insertContact({ orgId, email, source: 'Google AI' });
    }
    for (const phone of contactInfo.phones) {
        await insertContact({ orgId, phone, source: 'Google AI' });
    }
    if (contactInfo.emails.length === 0 && contactInfo.phones.length === 0) {
        await insertContact({ orgId, source: 'System' }); 
    }

    // --- 4. PUSH EVENT TO COHORT ---
    let newEventId = "";
    let eventUrl = "";
    let approvalStatus = "pending";

    const apiResponse: any = await submitEventToCohortApi(mappedEventData, manualOrgId);
    const eventDetails = apiResponse?.data?.eventDetails || apiResponse?.eventDetails || apiResponse;
    newEventId = eventDetails?.id || eventDetails?.occurenceId || "";
    eventUrl = \`https://turbo.cohort.social/community/69c6a422-3638-46b9-b27e-99c844adcfd8/organisation/\${manualOrgId}/events/\${newEventId}\`;

    if (newEventId) {
        const freshEventDetails = await getEventDetails(manualOrgId, newEventId);
        if (freshEventDetails && freshEventDetails.approvalStatus) {
            approvalStatus = freshEventDetails.approvalStatus === 'approved' ? 'published' : 'unpublished';
        }
    }

    // DB: Save Event
    await insertEvent({
        orgId,
        title: eventTitle,
        description: mappedEventData.description,
        startDate: fullStartTimestamp,
        location: finalLocation,
        url: targetUrl,
        cohortEventId: newEventId,
        cohortEventUrl: eventUrl,
        hindStatus: approvalStatus
    });

    // Mark pending scrape as approved
    await updatePendingScrapeStatus(pendingId, 'approved');
}
`;

pipelineContent = pipelineContent + newFunction;
fs.writeFileSync('backend/src/pipeline.ts', pipelineContent, 'utf-8');
console.log("Added approveWithManualOrg to pipeline.ts");
