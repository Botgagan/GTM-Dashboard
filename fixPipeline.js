const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const oldCall = `        orgId = await upsertOrganization({
            name: primaryOrganizer,
            status: subcommunityId ? 'unclaimed' : 'failed',
        city: contactInfo.city || p.locationStr,
        address: contactInfo.address,
        website: contactInfo.website,
        membersCount: contactInfo.members_count,
        createdFor: "event", 
        owner: "hind admin", 
        communityName: parentCommunityName, 
        subcommunityId: subcommunityId || undefined,
        adminInviteLink: adminInviteLink !== "Not Generated" ? adminInviteLink : undefined,
        failureReason: subcommunityId ? undefined : 'API Error',
        hindStatus: orgApprovalStatus
    });`;

const newCall = `        orgId = await upsertOrganization({
            name: primaryOrganizer,
            status: subcommunityId ? 'unclaimed' : 'failed',
        city: contactInfo.city || p.locationStr,
        address: contactInfo.address,
        website: contactInfo.website,
        membersCount: contactInfo.members_count,
        createdFor: "event", 
        owner: "hind admin", 
        communityName: parentCommunityName, 
        subcommunityId: subcommunityId || undefined,
        adminInviteLink: adminInviteLink !== "Not Generated" ? adminInviteLink : undefined,
        failureReason: subcommunityId ? undefined : 'API Error',
        hindStatus: orgApprovalStatus,
        richData: {
            logo: p.logo,
            images: p.images,
            accessibility: p.accessibility,
            offerings: p.offerings,
            amenities: p.amenities,
            payments: p.payments,
            description: p.mappedEventData?.description,
            googleBusinessLink: p.googleBusinessLink
        }
    });`;
content = content.replace(oldCall, newCall);

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Updated pipeline.ts to pass richData to db");
