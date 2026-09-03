const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const badMapping = `    let updatedName = p ? p.primaryOrganizer : orgRes.rows[0].name;
    let updatedWebsite = null;
    let updatedCity = p ? p.locationStr : orgRes.rows[0].city;
    let updatedAddress = p ? p.locationStr : orgRes.rows[0].city;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;
    
    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        if (orgDetails.location) updatedCity = orgDetails.location;
        if (orgDetails.address || orgDetails.location) updatedAddress = orgDetails.address || orgDetails.location;
        if (orgDetails.isPublished) updatedHindStatus = 'published';
        if (apiData.members) updatedMembersCount = parseInt(apiData.members) || 0;`;

const goodMapping = `    let updatedName = p ? p.primaryOrganizer : orgRes.rows[0].name;
    let updatedWebsite = null;
    let updatedCity = p ? p.locationStr : orgRes.rows[0].city;
    let updatedAddress = p ? p.locationStr : orgRes.rows[0].city;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;
    let updatedCommunityName = null;
    
    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        if (orgDetails.location) updatedCity = orgDetails.location;
        if (orgDetails.address || orgDetails.location) updatedAddress = orgDetails.address || orgDetails.location;
        if (orgDetails.isPublished) updatedHindStatus = 'published';
        if (apiData.members) updatedMembersCount = parseInt(apiData.members) || 0;
        if (orgDetails.parentCommunity && orgDetails.parentCommunity.name) {
            updatedCommunityName = orgDetails.parentCommunity.name;
        }`;

const badUpdate = `    // 4. Update the organization in our local DB with ALL fresh API data!
    await updateOrganization(localOrgId, {
        subcommunityId: manualOrgId,
        name: updatedName,
        orgName: updatedName,
        website: updatedWebsite,
        city: updatedCity,
        address: updatedAddress,
        hindStatus: updatedHindStatus,
        failureReason: null,
        status: 'unclaimed'
    });`;

const goodUpdate = `    // 4. Update the organization in our local DB with ALL fresh API data!
    await updateOrganization(localOrgId, {
        subcommunityId: manualOrgId,
        name: updatedName,
        orgName: updatedName,
        website: updatedWebsite,
        city: updatedCity,
        address: updatedAddress,
        hindStatus: updatedHindStatus,
        communityName: updatedCommunityName || undefined,
        createdFor: 'event',
        owner: 'hind admin',
        failureReason: null,
        status: 'unclaimed'
    });`;

content = content.replace(badMapping, goodMapping);
content = content.replace(badUpdate, goodUpdate);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts mapping to include communityName, createdFor, and owner");
