const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

const newFunctions = `
// ==========================================
// Organization Aliases (Deduplication)
// ==========================================

export async function insertOrganizationAlias(orgId: string, aliasName: string, platform: string = 'unknown') {
    try {
        await pool.query(
            \`INSERT INTO organization_aliases (org_id, alias_name, platform) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (alias_name, platform) DO NOTHING\`,
            [orgId, aliasName, platform]
        );
    } catch (e) {
        console.error('Error inserting alias:', e);
    }
}

export async function findLinkedOrgIdByAlias(aliasName: string, platform: string = 'unknown'): Promise<string | null> {
    const res = await pool.query(
        \`SELECT org_id FROM organization_aliases WHERE alias_name = $1 AND platform = $2 LIMIT 1\`,
        [aliasName, platform]
    );
    return res.rows.length > 0 ? res.rows[0].org_id : null;
}

export async function updatePendingScrapeLink(pendingId: string, linkedOrgId: string | null) {
    await pool.query(
        \`UPDATE pending_scrapes SET linked_org_id = $1 WHERE id = $2\`,
        [linkedOrgId, pendingId]
    );
}

export async function getAllOrganizationsForLLM() {
    const res = await pool.query(\`SELECT id, name FROM organizations WHERE subcommunity_id IS NOT NULL\`);
    return res.rows;
}
`;

content += newFunctions;
fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Added alias functions to db.ts");
