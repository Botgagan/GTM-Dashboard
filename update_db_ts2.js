const fs = require('fs');
let content = fs.readFileSync('backend/src/db.ts', 'utf-8');

// Replace the insertEvent interface and function
const oldInsert = `export async function insertEvent(data: {
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
        \`INSERT INTO events (org_id, title, event_date, end_date, location, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\`,
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
            data.hindStatus || 'pending'
        ]
    );
}`;

const newInsert = `export async function insertEvent(data: {
    orgId: string;
    title: string;
    startDate?: string;
    startTime?: string;
    endDate?: string;
    endTime?: string;
    location?: string;
    hindUrl?: string;
    sourceUrl?: string;
    cohortEventId?: string;
    status?: string;
    hindStatus?: string;
}) {
    await pool.query(
        \`INSERT INTO events (org_id, title, start_date, start_time, end_date, end_time, location, hind_url, source_url, cohort_event_id, status, hind_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)\`,
        [
            data.orgId,
            data.title,
            data.startDate || null,
            data.startTime || null,
            data.endDate || null,
            data.endTime || null,
            data.location || null,
            data.hindUrl || null,
            data.sourceUrl || null,
            data.cohortEventId || null,
            data.status || 'new',
            data.hindStatus || 'pending'
        ]
    );
}`;

content = content.replace(oldInsert, newInsert);
fs.writeFileSync('backend/src/db.ts', content, 'utf-8');
console.log("Updated insertEvent function in db.ts");
