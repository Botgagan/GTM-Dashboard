const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const badSignature = `export async function updateOrganization(id: string, data: Partial<{
    name: string;
    orgName: string;
    status: string;
    address: string;
    city: string;
    website: string;
    subcommunityId: string;
    adminInviteLink: string;
    failureReason: string | null;
    hindStatus: string;
}>) {`;

const goodSignature = `export async function updateOrganization(id: string, data: Partial<{
    name: string;
    orgName: string;
    status: string;
    address: string;
    city: string;
    website: string;
    subcommunityId: string;
    adminInviteLink: string;
    failureReason: string | null;
    hindStatus: string;
    communityName: string;
    createdFor: string;
    owner: string;
}>) {`;

content = content.replace(badSignature, goodSignature);

const badUpdateBody = `    if (data.website !== undefined) { sets.push(\`website = $\${idx++}\`); values.push(data.website); }
    if (data.subcommunityId !== undefined) { sets.push(\`subcommunity_id = $\${idx++}\`); values.push(data.subcommunityId); }
    if (data.adminInviteLink !== undefined) { sets.push(\`admin_invite_link = $\${idx++}\`); values.push(data.adminInviteLink); }
    if (data.failureReason !== undefined) { sets.push(\`failure_reason = $\${idx++}\`); values.push(data.failureReason); }
    if (data.hindStatus !== undefined) { sets.push(\`hind_status = $\${idx++}\`); values.push(data.hindStatus); }`;

const goodUpdateBody = `    if (data.website !== undefined) { sets.push(\`website = $\${idx++}\`); values.push(data.website); }
    if (data.subcommunityId !== undefined) { sets.push(\`subcommunity_id = $\${idx++}\`); values.push(data.subcommunityId); }
    if (data.adminInviteLink !== undefined) { sets.push(\`admin_invite_link = $\${idx++}\`); values.push(data.adminInviteLink); }
    if (data.failureReason !== undefined) { sets.push(\`failure_reason = $\${idx++}\`); values.push(data.failureReason); }
    if (data.hindStatus !== undefined) { sets.push(\`hind_status = $\${idx++}\`); values.push(data.hindStatus); }
    if (data.communityName !== undefined) { sets.push(\`community_name = $\${idx++}\`); values.push(data.communityName); }
    if (data.createdFor !== undefined) { sets.push(\`created_for = $\${idx++}\`); values.push(data.createdFor); }
    if (data.owner !== undefined) { sets.push(\`owner = $\${idx++}\`); values.push(data.owner); }`;

content = content.replace(badUpdateBody, goodUpdateBody);
fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated db.ts updateOrganization to support new fields");
