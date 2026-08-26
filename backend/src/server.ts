import express from 'express';
import cors from 'cors';
import { getDashboardData, getOrgContacts, getOrgEvents, getCities, pool } from './db';
import { processUrl } from './pipeline';
import cron from 'node-cron';
import { runDailyDiscovery } from './discoveryEngine';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API Routes
app.get('/api/dashboard', async (req, res) => {
    try {
        const city = req.query.city as string | undefined;
        const data = await getDashboardData(city);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/org/:id/contacts', async (req, res) => {
    try {
        const data = await getOrgContacts(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/org/:id/events', async (req, res) => {
    try {
        const data = await getOrgEvents(req.params.id);
        res.json(data);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/cities', async (req, res) => {
    try {
        const cities = await getCities();
        res.json(cities);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/contacts/:id/toggle', async (req, res) => {
    try {
        const { enabled } = req.body;
        const { toggleContactSendEnabled } = await import('./db');
        await toggleContactSendEnabled(req.params.id, enabled);
        res.json({ success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/org/:id/send-instantly', async (req, res) => {
    try {
        const orgId = req.params.id;
        const { getDashboardData, getOrgContacts, getOrgEvents, markOrgAsContacted } = await import('./db');
        const { pushLeadToInstantly } = await import('./instantlyClient');
        
        // Fetch org data
        const orgs = await getDashboardData();
        const org = orgs.find((o: any) => o.id === orgId);
        if (!org) return res.status(404).json({ error: "Org not found" });

        // Fetch contacts and filter by send_enabled
        const allContacts = await getOrgContacts(orgId);
        const contactsToSend = allContacts.filter((c: any) => c.send_enabled);
        
        if (contactsToSend.length === 0) {
            return res.status(400).json({ error: "No enabled contacts to send" });
        }

        // Fetch latest event
        const events = await getOrgEvents(orgId);
        const latestEvent = events[0] || {};

        // Format for Instantly
        const contactInfo = {
            emails: contactsToSend.map((c: any) => c.email).filter(Boolean),
            phones: contactsToSend.map((c: any) => c.phone).filter(Boolean)
        };

        // If a placeholder was saved, ensure we still push it (or skip it based on rules)
        
        await pushLeadToInstantly(
            contactsToSend, 
            org, 
            latestEvent.title || "Unknown Event", 
            latestEvent.hind_url || ""
        );

        await markOrgAsContacted(orgId);
        res.json({ success: true, message: `Sent ${contactInfo.emails.length} emails to Instantly!` });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

// SSE endpoint to trigger pipeline and stream logs
app.get('/api/scrape', async (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
        res.status(400).send('URL is required');
        return;
    }

    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ type: 'log', message: 'Connected to scraping server...' })}\n\n`);

    const logCallback = (msg: string) => {
        // SSE format requires starting with "data: " and ending with "\n\n"
        res.write(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`);
    };

    try {
        await processUrl(targetUrl, logCallback);
        res.write(`data: ${JSON.stringify({ type: 'done', message: 'Scraping complete.' })}\n\n`);
    } catch (err: any) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    } finally {
        res.end();
    }
});

// ----------------- SYNC ENDPOINT -----------------
app.post('/api/sync-all', async (req, res) => {
    try {
        const { getDashboardData, getOrgEvents, updateOrganization, updateEvent } = await import('./db');
        const { getSubcommunityDetails, getEventDetails } = await import('./apiClient');
        
        const orgs = await getDashboardData();
        for (const org of orgs) {
            if (org.subcommunity_id) {
                console.log(`Syncing Org: ${org.name} (${org.subcommunity_id})`);
                const details = await getSubcommunityDetails(org.subcommunity_id);
                if (details && details.orgDetails) {
                    const isPub = details.orgDetails.isPublished;
                    const hindStatus = isPub ? 'published' : 'unpublished';
                    let parentName = org.community_name;
                    if (details.orgDetails.parentCommunity && details.orgDetails.parentCommunity.name) {
                        parentName = details.orgDetails.parentCommunity.name;
                    }
                    
                    await updateOrganization(org.id, {
                        ...org,
                        hind_status: hindStatus,
                        community_name: parentName
                    });
                }
                
                // Sync events for this org
                const events = await getOrgEvents(org.id);
                for (const ev of events) {
                    if (ev.cohort_event_id) {
                        console.log(`Syncing Event: ${ev.title} (${ev.cohort_event_id})`);
                        const evDetails = await getEventDetails(org.subcommunity_id, ev.cohort_event_id);
                        if (evDetails) {
                            const isPub = evDetails.approvalStatus === 'approved' || evDetails.isPublished;
                            const evHindStatus = isPub ? 'published' : 'unpublished';
                            
                            await updateEvent(ev.id, {
                                ...ev,
                                hind_status: evHindStatus
                            });
                        }
                    }
                }
            }
        }
        res.json({ success: true });
    } catch (e: any) { 
        console.error('Sync error:', e);
        res.status(500).json({ error: e.message }); 
    }
});

// ----------------- CRUD ENDPOINTS -----------------
app.post('/api/org', async (req, res) => {
    try {
        const { createOrganization } = await import('./db');
        const id = await createOrganization(req.body);
        res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/org/:id', async (req, res) => {
    try {
        const { updateOrganization } = await import('./db');
        await updateOrganization(req.params.id, req.body);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/org/:id', async (req, res) => {
    try {
        const { deleteOrganization } = await import('./db');
        await deleteOrganization(req.params.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/org/:id/contacts', async (req, res) => {
    try {
        const { createContact } = await import('./db');
        const id = await createContact(req.params.id, req.body);
        res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/contacts/:id', async (req, res) => {
    try {
        const { updateContact } = await import('./db');
        await updateContact(req.params.id, req.body);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/contacts/:id', async (req, res) => {
    try {
        const { deleteContact } = await import('./db');
        await deleteContact(req.params.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/org/:id/events', async (req, res) => {
    try {
        const { createEvent } = await import('./db');
        const id = await createEvent(req.params.id, req.body);
        res.json({ id });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.put('/api/events/:id', async (req, res) => {
    try {
        const { updateEvent } = await import('./db');
        await updateEvent(req.params.id, req.body);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/events/:id', async (req, res) => {
    try {
        const { deleteEvent } = await import('./db');
        await deleteEvent(req.params.id);
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ----------------- PENDING SCRAPES ENDPOINTS -----------------
app.get('/api/pending-scrapes', async (req, res) => {
    try {
        const { getPendingScrapes } = await import('./db');
        const data = await getPendingScrapes();
        res.json(data);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/pending-scrapes/:id/approve', async (req, res) => {
    try {
        const { approvePendingScrape } = await import('./pipeline');
        await approvePendingScrape(req.params.id);
        res.json({ success: true });
    } catch (e: any) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/pending-scrapes/:id/reject', async (req, res) => {
    try {
        const { updatePendingScrapeStatus } = await import('./db');
        await updatePendingScrapeStatus(req.params.id, 'rejected');
        res.json({ success: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ===== Platform Management & Scraped URLs Endpoints =====

app.get('/api/platforms', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM scraping_platforms ORDER BY name ASC');
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/platforms/:id/toggle', async (req, res) => {
    try {
        const { is_active } = req.body;
        await pool.query('UPDATE scraping_platforms SET is_active = $1 WHERE id = $2', [is_active, req.params.id]);
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/platforms', async (req, res) => {
    try {
        const { name, domain, search_path } = req.body;
        await pool.query(
            'INSERT INTO scraping_platforms (name, domain, search_path) VALUES ($1, $2, $3)',
            [name, domain, search_path]
        );
        res.json({ success: true });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/scraped-urls', async (req, res) => {
    try {
        const filter = req.query.filter || 'all'; // 'today', 'week', 'month', 'all'
        
        let dateCondition = '';
        if (filter === 'today') dateCondition = "WHERE s.discovered_at >= current_date";
        else if (filter === 'week') dateCondition = "WHERE s.discovered_at >= current_date - interval '7 days'";
        else if (filter === 'month') dateCondition = "WHERE s.discovered_at >= current_date - interval '30 days'";

        const { rows } = await pool.query(`
            SELECT s.*, p.name as platform_name, p.domain 
            FROM scraped_urls_history s 
            LEFT JOIN scraping_platforms p ON s.platform_id = p.id
            ${dateCondition}
            ORDER BY s.discovered_at DESC
        `);
        res.json(rows);
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// ===== Run Discovery Engine Cron Job =====
cron.schedule('15 16 * * *', async () => {
    console.log(`[Cron] Triggering daily discovery engine at 4:15 PM IST...`);
    await runDailyDiscovery();
}, {
    timezone: "Asia/Kolkata"
});

// Debug endpoint to manually trigger discovery for testing
app.post('/api/debug/run-discovery', async (req, res) => {
    runDailyDiscovery(); // run asynchronously
    res.json({ message: 'Discovery engine started in background' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
});
