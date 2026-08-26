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
}): Promise<string> {
    const res = await pool.query(
        `INSERT INTO organizations
            (name, status, org_name, address, city, website, subcommunity_id, admin_invite_link, failure_reason, community_name, created_for, owner, members_count, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
            data.hindStatus || 'pending'
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
    const fields = ['name', 'community_name', 'created_for', 'owner', 'members_count', 'org_name', 'city', 'address', 'website', 'status', 'hind_status', 'admin_invite_link'];
    const setClauses = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
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
export async function getOrgEvents(orgId: string) {
    const res = await pool.query(
        `SELECT * FROM events WHERE org_id = $1 ORDER BY created_at DESC`,
        [orgId]
    );
    return res.rows;
}

export async function insertEvent(data: {
    orgId: string;
    title: string;
    eventDate?: string;
    endDate?: string;
    location?: string;
    hindUrl?: string;
    sourceUrl?: string;
    cohortEventId?: string;
    status?: string;
    hindStatus?: string;
}) {
    await pool.query(
        `INSERT INTO events (org_id, title, event_date, end_date, location, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            data.orgId,
            data.title,
            data.eventDate || null,
            data.endDate || null,
            data.location || null,
            data.hindUrl || null,
            data.sourceUrl || null,
            data.cohortEventId || null,
            data.status || 'new',
            data.hindStatus || 'pending',
        ]
    );
}

export async function createEvent(orgId: string, eventData: any) {
    const fields = ['title', 'status', 'event_date', 'end_date', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];
    const keys = fields.join(', ');
    const vals = fields.map((_, i) => `$${i + 2}`).join(', ');
    const values = fields.map(f => eventData[f]);
    const res = await pool.query(`INSERT INTO events (org_id, ${keys}) VALUES ($1, ${vals}) RETURNING id`, [orgId, ...values]);
    return res.rows[0].id;
}

export async function updateEvent(id: string, data: any) {
    const fields = ['title', 'status', 'event_date', 'end_date', 'location', 'hind_url', 'hind_status', 'source_url', 'sent_on'];
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
    const cityFilter = city ? `AND o.city ILIKE $1` : '';
    const params = city ? [`%${city}%`] : [];

    const orgs = await pool.query(
        `SELECT
            o.*,
            COUNT(DISTINCT c.id)::int AS contacts_count,
            COUNT(DISTINCT e.id)::int AS events_count
         FROM organizations o
         LEFT JOIN contacts c ON c.org_id = o.id
         LEFT JOIN events e ON e.org_id = o.id
         WHERE 1=1 ${cityFilter}
         GROUP BY o.id
         ORDER BY o.created_at DESC`,
        params
    );

    return orgs.rows;
}


export async function getCities() {
    const res = await pool.query(
        `SELECT DISTINCT city FROM organizations WHERE city IS NOT NULL ORDER BY city`
    );
    return res.rows.map((r: any) => r.city);
}

// ─────────────────────────────────────────────
// Pending Scrapes
// ─────────────────────────────────────────────
export async function getPendingScrapes() {
    const res = await pool.query(`SELECT * FROM pending_scrapes ORDER BY created_at DESC`);
    return res.rows;
}

export async function getPendingScrapeById(id: string) {
    const res = await pool.query(`SELECT * FROM pending_scrapes WHERE id = $1`, [id]);
    return res.rows[0];
}

export async function insertPendingScrape(sourceUrl: string, payload: any) {
    const res = await pool.query(
        `INSERT INTO pending_scrapes (source_url, payload, status) VALUES ($1, $2, 'pending') RETURNING id`,
        [sourceUrl, JSON.stringify(payload)]
    );
    return res.rows[0].id;
}

export async function updatePendingScrapeStatus(id: string, status: string) {
    await pool.query(`UPDATE pending_scrapes SET status = $1 WHERE id = $2`, [status, id]);
}

