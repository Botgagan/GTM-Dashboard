const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const badMapping = `    let updatedName = p.primaryOrganizer;
    let updatedWebsite = null;
    let updatedCity = p.locationStr;
    
    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        // Map location if available, otherwise keep scraped city
        if (orgDetails.location) updatedCity = orgDetails.location;
        
        // Handle Contacts (email/phone) mapping
        const email = orgDetails.email;
        const phone = orgDetails.phoneNo;
        
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
    });`;

const goodMapping = `    let updatedName = p.primaryOrganizer;
    let updatedWebsite = null;
    let updatedCity = p.locationStr;
    let updatedAddress = p.locationStr;
    let updatedHindStatus = 'unpublished';
    let updatedMembersCount = 0;
    
    const orgDetails = apiData?.orgDetails || apiData?.details;
    if (orgDetails) {
        if (orgDetails.name) updatedName = orgDetails.name;
        if (orgDetails.website) updatedWebsite = orgDetails.website;
        if (orgDetails.location) updatedCity = orgDetails.location;
        if (orgDetails.address || orgDetails.location) updatedAddress = orgDetails.address || orgDetails.location;
        if (orgDetails.isPublished) updatedHindStatus = 'published';
        if (apiData.members) updatedMembersCount = parseInt(apiData.members) || 0;
        
        // Handle Contacts (email/phone) mapping
        const email = orgDetails.email;
        const phone = orgDetails.phoneNo;
        
        if (email && email.indexOf('@placeholder.com') === -1) {
            await pool.query("INSERT INTO contacts (org_id, email, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, email]);
        }
        if (phone) {
            await pool.query("INSERT INTO contacts (org_id, phone, source) VALUES ($1, $2, 'Cohort API') ON CONFLICT DO NOTHING", [localOrgId, phone]);
        }
    }

    // 4. Update the organization in our local DB with ALL fresh API data!
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
    });
    if (updatedMembersCount > 0) {
        await pool.query('UPDATE organizations SET members_count = $1 WHERE id = $2', [updatedMembersCount, localOrgId]);
    }`;

content = content.replace(badMapping, goodMapping);
fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Enhanced database mapping to store all hidden fields");
