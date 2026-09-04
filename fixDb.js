const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const oldSig = `export async function upsertOrganization(data: {
    name: string;
    status?: 'unclaimed' | 'claimed' | 'failed';
    orgName?: string;
    address?: string;
    city?: string;
    website?: string;
    subcommunityId?: string;
    adminInviteLink?: string;
    failureReason?: string;
    communityName?: string;
    createdFor?: string;
    owner?: string;
    membersCount?: number;
    hindStatus?: string;
}) {`;

const newSig = `export async function upsertOrganization(data: {
    name: string;
    status?: 'unclaimed' | 'claimed' | 'failed';
    orgName?: string;
    address?: string;
    city?: string;
    website?: string;
    subcommunityId?: string;
    adminInviteLink?: string;
    failureReason?: string;
    communityName?: string;
    createdFor?: string;
    owner?: string;
    membersCount?: number;
    hindStatus?: string;
    richData?: any;
}) {`;
content = content.replace(oldSig, newSig);

const oldQuery = `        \`INSERT INTO organizations
            (name, status, org_name, address, city, website, subcommunity_id, admin_invite_link, failure_reason, community_name, created_for, owner, members_count, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id\`,
        [
            data.name,
            data.status || 'unclaimed',
            data.orgName || data.name,
            data.address || null,
            data.city || null,
            data.website || null,
            data.subcommunityId || null,
            data.adminInviteLink || null,
            data.failureReason || null,
            data.communityName || null,
            data.createdFor || null,
            data.owner || null,
            data.membersCount || 0,
            data.hindStatus || 'pending'
        ]`;

const newQuery = `        \`INSERT INTO organizations
            (name, status, org_name, address, city, website, subcommunity_id, admin_invite_link, failure_reason, community_name, created_for, owner, members_count, hind_status, rich_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id\`,
        [
            data.name,
            data.status || 'unclaimed',
            data.orgName || data.name,
            data.address || null,
            data.city || null,
            data.website || null,
            data.subcommunityId || null,
            data.adminInviteLink || null,
            data.failureReason || null,
            data.communityName || null,
            data.createdFor || null,
            data.owner || null,
            data.membersCount || 0,
            data.hindStatus || 'pending',
            data.richData ? JSON.stringify(data.richData) : null
        ]`;
content = content.replace(oldQuery, newQuery);

fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated db.ts to insert richData");
