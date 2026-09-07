import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

// Connection pool — reused across the whole app
export const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'gtm_db',
    user:     process.env.DB_USER     || 'gtm_user',
    password: process.env.DB_PASSWORD || 'gtm_password',
});

pool.on('error', (err) => {
    console.error('Unexpected DB error:', err.message);
});

// ─────────────────────────────────────────────
// Organization helpers
// ─────────────────────────────────────────────
export async function upsertOrganization(data: {
    name: string;
    status?: string;
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
}): Promise<string> {
    const res = await pool.query(
        `INSERT INTO organizations
            (name, status, org_name, address, city, website, subcommunity_id, admin_invite_link, failure_reason, community_name, created_for, owner, members_count, hind_status, rich_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         RETURNING id`,
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
        ]
    );
    return res.rows[0].id;
}

export async function updateOrganizationStatus(id: string, status: string, owner?: string) {
    await pool.query(
        `UPDATE organizations SET status = $1, owner = COALESCE($2, owner), updated_at = NOW() WHERE id = $3`,
        [status, owner || null, id]
    );
}

export async function updateOrganization(id: string, data: any) {
    const fields = ['name', 'community_name', 'created_for', 'owner', 'members_count', 'org_name', 'city', 'address', 'website', 'status', 'hind_status', 'admin_invite_link', 'rich_data'];
    const setClauses = fields.map((f, i) => `${f} = ${i + 2}`).join(', ');
    const values = fields.map(f => data[f]);
    await pool.query(`UPDATE organizations SET ${setClauses} WHERE id = $1`, [id, ...values]);
}

export async function deleteOrganization(id: string) {
    await pool.query(`DELETE FROM organizations WHERE id = $1`, [id]);
}

export async function createOrganization(data: any) {
    const fields = ['name', 'community_name', 'created_for', 'owner', 'members_count', 'org_name', 'city', 'address', 'website', 'status', 'hind_status', 'admin_invite_link'];
    const keys = fields.join(', ');
    const vals = fields.map((_, i) => `$${i + 1}`).join(', ');
    const values = fields.map(f => data[f]);
    const res = await pool.query(`INSERT INTO organizations (${keys}) VALUES (${vals}) RETURNING id`, values);
    return res.rows[0].id;
}

// ─────────────────────────────────────────────
// Contact helpers
// ─────────────────────────────────────────────
export async function getOrgContacts(orgId: string) {
    const res = await pool.query(
        `SELECT * FROM contacts WHERE org_id = $1 ORDER BY created_at ASC`,
        [orgId]
    );
    return res.rows;
}

export async function insertContact(data: {
    orgId: string;
    email?: string;
    phone?: string;
    source?: string;
    name?: string;
    title?: string;
    social?: string;
}) {
    await pool.query(
        `INSERT INTO contacts (org_id, email, phone, source, name, title, social)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
            data.orgId,
            data.email || null,
            data.phone || null,
            data.source || 'Google',
            data.name || null,
            data.title || null,
            data.social || null,
        ]
    );
}

export async function createContact(orgId: string, contact: any) {
    const fields = ['name', 'title', 'email', 'phone', 'social', 'source'];
    const keys = fields.join(', ');
    const vals = fields.map((_, i) => `$${i + 2}`).join(', ');
    const values = fields.map(f => contact[f]);
    const res = await pool.query(`INSERT INTO contacts (org_id, ${keys}) VALUES ($1, ${vals}) RETURNING id`, [orgId, ...values]);
    return res.rows[0].id;
}

export async function updateContact(id: string, data: any) {
    const fields = ['name', 'title', 'email', 'phone', 'social', 'source', 'send_enabled'];
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => data[f]);
    await pool.query(`UPDATE contacts SET ${setClauses} WHERE id = $1`, [id, ...values]);
}

export async function deleteContact(id: string) {
    await pool.query(`DELETE FROM contacts WHERE id = $1`, [id]);
}

export async function toggleContactSendEnabled(contactId: string, enabled: boolean) {
    await pool.query(
        `UPDATE contacts SET send_enabled = $1 WHERE id = $2`,
        [enabled, contactId]
    );
}

export async function markOrgAsContacted(orgId: string) {
    await pool.query(
        `UPDATE organizations SET last_contacted_at = NOW() WHERE id = $1`,
        [orgId]
    );
}

// ─────────────────────────────────────────────
// Event helpers
// ─────────────────────────────────────────────
export async function getOrgEvents(orgId: string, city?: string) {
    if (city) {
        const res = await pool.query(
            `SELECT * FROM events WHERE org_id = $1 AND city ILIKE $2 ORDER BY created_at DESC`,
            [orgId, `%${city}%`]
        );
        return res.rows;
    } else {
        const res = await pool.query(
            `SELECT * FROM events WHERE org_id = $1 ORDER BY created_at DESC`,
            [orgId]
        );
        return res.rows;
    }
}

export async function insertEvent(data: {
    orgId: string;
    title: string;
    eventDate?: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    city?: string;
    hindUrl?: string;
    sourceUrl?: string;
    cohortEventId?: string;
    status?: string;
    hindStatus?: string;
}) {
    await pool.query(
        `INSERT INTO events (org_id, title, event_date, start_date, start_time, end_date, end_time, location, city, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,

        [
            data.orgId,
            data.title,
            data.eventDate || null,
            data.startDate || null,
            data.startTime || null,
            data.endDate || null,
            data.endTime || null,
            data.location || null,
            data.city || null,
            data.hindUrl || null,
            data.sourceUrl || null,
            data.cohortEventId || null,
            data.status || 'new',
            data.hindStatus || 'pending',
        ]
    );
}

export async function createEvent(orgId: string, eventData: any) {
    const fields = ['title', 'status', 'start_date', 'start_time', 'end_date', 'end_time', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];
    const keys = fields.join(', ');
    const vals = fields.map((_, i) => `$${i + 2}`).join(', ');
    const values = fields.map(f => eventData[f]);
    const res = await pool.query(`INSERT INTO events (org_id, ${keys}) VALUES ($1, ${vals}) RETURNING id`, [orgId, ...values]);
    return res.rows[0].id;
}

export async function updateEvent(id: string, data: any) {
    const fields = ['title', 'status', 'start_date', 'start_time', 'end_date', 'end_time', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => data[f]);
    await pool.query(`UPDATE events SET ${setClauses} WHERE id = $1`, [id, ...values]);
}

export async function deleteEvent(id: string) {
    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
}

// ─────────────────────────────────────────────
// Pipeline run helpers
// ─────────────────────────────────────────────
export async function createPipelineRun(sourceUrl: string): Promise<string> {
    const res = await pool.query(
        `INSERT INTO pipeline_runs (source_url, status) VALUES ($1, 'running') RETURNING id`,
        [sourceUrl]
    );
    return res.rows[0].id;
}

export async function completePipelineRun(runId: string, orgId: string | null, status: 'success' | 'failed', log: string, error?: string) {
    await pool.query(
        `UPDATE pipeline_runs
         SET status = $1, org_id = $2, log = $3, error_message = $4, completed_at = NOW()
         WHERE id = $5`,
        [status, orgId || null, log, error || null, runId]
    );
}

// ─────────────────────────────────────────────
// Dashboard query — full data for all 3 tabs
// ─────────────────────────────────────────────
export async function getDashboardData(city?: string) {
    let query = `
        SELECT
            o.*,
            COUNT(DISTINCT c.id)::int AS contacts_count,
            COUNT(DISTINCT e.id)::int AS events_count
        FROM organizations o
        LEFT JOIN contacts c ON c.org_id = o.id
    `;
    
    let params: any[] = [];
    
    if (city) {
        query += ` LEFT JOIN events e ON e.org_id = o.id AND e.location ILIKE $1`;
        params.push(`%${city}%`);
    } else {
        query += ` LEFT JOIN events e ON e.org_id = o.id`;
    }
    
    query += ` GROUP BY o.id`;
    
    if (city) {
        query += ` HAVING COUNT(DISTINCT e.id) > 0`;
    }
    
    query += ` ORDER BY o.created_at DESC`;

    const orgs = await pool.query(query, params);
    return orgs.rows;
}


export async function getCities() {
    const res = await pool.query(`SELECT DISTINCT location FROM events WHERE location IS NOT NULL`);
    const rawLocations = res.rows.map(r => r.location);
    const cities = new Set<string>();
    for (const loc of rawLocations) {
        const parts = loc.split(',');
        const city = parts[parts.length - 1].trim();
        if (city) cities.add(city);
    }
    return Array.from(cities).sort();
}

// ─────────────────────────────────────────────
// Pending Scrapes
// ─────────────────────────────────────────────
export async function getPendingScrapes(city?: string) {
    const query = `
        SELECT ps.*, o.name as linked_org_name, o.website as linked_org_website, o.subcommunity_id as linked_org_subcommunity_id, o.city as linked_org_city, o.created_at as linked_org_created_at 
        FROM pending_scrapes ps 
        LEFT JOIN organizations o ON ps.linked_org_id = o.id 
    `;
    if (city) {
        const res = await pool.query(
            query + ` WHERE ps.payload::jsonb -> 'contactInfo' ->> 'city' ILIKE $1 ORDER BY ps.created_at DESC`,
            [`%${city}%`]
        );
        return res.rows;
    } else {
        const res = await pool.query(query + ` ORDER BY ps.created_at DESC`);
        return res.rows;
    }
}

export async function getPendingScrapeById(id: string) {
    const res = await pool.query(`SELECT * FROM pending_scrapes WHERE id = $1`, [id]);
    return res.rows[0];
}

export async function insertPendingScrape(sourceUrl: string, payload: any, linkedOrgId: string | null = null) {
    const res = await pool.query(
        `INSERT INTO pending_scrapes (source_url, payload, status, linked_org_id) VALUES ($1, $2, 'pending', $3) RETURNING id`,
        [sourceUrl, JSON.stringify(payload), linkedOrgId]
    );
    return res.rows[0].id;
}

export async function updatePendingScrapeStatus(id: string, status: string) {
    await pool.query(`UPDATE pending_scrapes SET status = $1 WHERE id = $2`, [status, id]);
}


// ==========================================
// Organization Aliases (Deduplication)
// ==========================================

export async function insertOrganizationAlias(orgId: string, aliasName: string, platform: string = 'unknown') {
    try {
        await pool.query(
            `INSERT INTO organization_aliases (org_id, alias_name, platform) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (alias_name, platform) DO NOTHING`,
            [orgId, aliasName, platform]
        );
    } catch (e) {
        console.error('Error inserting alias:', e);
    }
}

export async function findLinkedOrgIdByAlias(aliasName: string, platform: string = 'unknown'): Promise<string | null> {
    const res = await pool.query(
        `SELECT org_id FROM organization_aliases WHERE alias_name = $1 AND platform = $2 LIMIT 1`,
        [aliasName, platform]
    );
    return res.rows.length > 0 ? res.rows[0].org_id : null;
}

export async function updatePendingScrapeLink(pendingId: string, linkedOrgId: string | null) {
    await pool.query(
        `UPDATE pending_scrapes SET linked_org_id = $1 WHERE id = $2`,
        [linkedOrgId, pendingId]
    );
}

export async function getAllOrganizationsForLLM() {
    const res = await pool.query(`SELECT id, name FROM organizations WHERE subcommunity_id IS NOT NULL`);
    return res.rows;
}
