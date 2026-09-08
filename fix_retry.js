const fs = require('fs');
let content = fs.readFileSync('backend/src/pipeline.ts', 'utf-8');

const regex = /\/\/ 4\. Update the organization in our local DB with ALL fresh API data![\s\S]*?\/\/ 5\. Submit Event to Cohort API/m;
const replacement = `// 4. Update the organization in our local DB safely!
    // We explicitly avoid updateOrganization() here because it is a "full replace" function
    // that accidentally nullifies missing fields like rich_data and address.
    await pool.query(\`
        UPDATE organizations 
        SET 
            subcommunity_id = $1,
            name = COALESCE($2, name),
            org_name = COALESCE($3, org_name),
            website = COALESCE($4, website),
            hind_status = $5,
            community_name = COALESCE($6, community_name),
            created_for = 'event',
            owner = 'hind admin',
            failure_reason = NULL,
            status = 'unclaimed',
            updated_at = NOW()
        WHERE id = $7
    \`, [manualOrgId, updatedName, updatedName, updatedWebsite, updatedHindStatus, updatedCommunityName, localOrgId]);

    if (updatedMembersCount > 0) {
        await pool.query('UPDATE organizations SET members_count = $1 WHERE id = $2', [updatedMembersCount, localOrgId]);
    }

    // 5. Submit Event to Cohort API`;

if (content.match(regex)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
    console.log("Replaced Step 4");
} else {
    console.log("Regex 4 not found");
}

const regex2 = /\/\/ 7\. Generate Admin Invite Link[\s\S]*?console\.log\(`\?\?\? Manual Organization Link Successful!`\);\s*\}/m;
const replacement2 = `// 7. Generate Admin Invite Link
    try {
        const adminInviteLink = await apiClient.getAdminInviteLink(manualOrgId);
        if (adminInviteLink && adminInviteLink !== "Not Generated") {
            await pool.query("UPDATE organizations SET admin_invite_link = $1 WHERE id = $2", [adminInviteLink, localOrgId]);
        }
    } catch(e) { console.error("Failed to fetch admin link on manual retry"); }

    console.log(\`??? Manual Organization Link Successful!\`);
}`;

if (content.match(regex2)) {
    content = content.replace(regex2, replacement2);
    fs.writeFileSync('backend/src/pipeline.ts', content, 'utf-8');
    console.log("Replaced Step 7");
} else {
    console.log("Regex 7 not found");
}
