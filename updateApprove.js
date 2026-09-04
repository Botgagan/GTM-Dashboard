const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const anchor = `    // --- 3. CREATE SUBCOMMUNITY FIRST ---
    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    const subcommunityId = await createSubcommunity(primaryOrganizer, contactInfo.emails[0] || "", contactInfo.phones[0] || "");`;

const newCode = `    // --- 3. SUBCOMMUNITY HANDLING (LINKED VS NEW) ---
    let adminInviteLink = "Not Generated";
    let orgApprovalStatus = "pending";
    let parentCommunityName = undefined;
    let subcommunityId = null;
    let orgId = null;

    if (row.linked_org_id) {
        console.log(\`??? This event is pre-linked to Organization ID: \${row.linked_org_id}\`);
        orgId = row.linked_org_id;
        
        // Fetch existing org to get subcommunity_id
        const { pool, insertOrganizationAlias } = await import('./db');
        const orgRes = await pool.query('SELECT subcommunity_id FROM organizations WHERE id = $1', [orgId]);
        if (orgRes.rows.length > 0 && orgRes.rows[0].subcommunity_id) {
            subcommunityId = orgRes.rows[0].subcommunity_id;
        }

        // Train the Alias dictionary! We know this mapping works now.
        if (primaryOrganizer && primaryOrganizer !== "Unknown Organizer") {
            await insertOrganizationAlias(orgId, primaryOrganizer, 'unknown');
        }

    } else {
        // Standard Flow: CREATE BRAND NEW SUBCOMMUNITY
        console.log(\`??? No link found. Creating brand new subcommunity for \${primaryOrganizer}\`);
        subcommunityId = await createSubcommunity(primaryOrganizer, contactInfo.emails[0] || "", contactInfo.phones[0] || "");
    }`;

content = content.replace(anchor, newCode);

const insertAnchor = `    // DB: Save organization
    const orgId = await upsertOrganization({
        name: primaryOrganizer,
        status: subcommunityId ? 'unclaimed' : 'failed',`;

const newInsert = `    // DB: Save organization (ONLY IF NEW)
    if (!row.linked_org_id) {
        orgId = await upsertOrganization({
            name: primaryOrganizer,
            status: subcommunityId ? 'unclaimed' : 'failed',`;

content = content.replace(insertAnchor, newInsert);

const closeAnchor = `    if (contactInfo.emails.length === 0 && contactInfo.phones.length === 0) {
        await insertContact({ orgId, source: 'System' }); 
    }`;

const newClose = `    if (contactInfo.emails.length === 0 && contactInfo.phones.length === 0) {
        await insertContact({ orgId, source: 'System' }); 
    }
    
    // Train the AI on the new org creation
    if (primaryOrganizer && primaryOrganizer !== "Unknown Organizer") {
        const { insertOrganizationAlias } = await import('./db');
        await insertOrganizationAlias(orgId, primaryOrganizer, 'unknown');
    }
    }`;

content = content.replace(closeAnchor, newClose);

fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
console.log("Refactored approvePendingScrape for Linked vs New flows");
