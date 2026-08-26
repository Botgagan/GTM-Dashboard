-- ============================================================
-- GTM Dashboard Schema — Hind Social
-- ============================================================

-- Organizations (Subcommunities) table
-- status: 'unclaimed' | 'claimed' | 'failed'
CREATE TABLE IF NOT EXISTS organizations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,                          -- Organizer/subcommunity name
    status          TEXT NOT NULL DEFAULT 'unclaimed',      -- claimed | unclaimed | failed
    community_name  TEXT DEFAULT 'Hind Dev',
    created_for     TEXT DEFAULT 'Event',
    owner           TEXT DEFAULT 'Hind Admin',              -- 'Hind Admin' until they claim it
    members_count   INTEGER DEFAULT 1,
    org_name        TEXT,                                   -- Official organization name
    address         TEXT,
    city            TEXT,
    website         TEXT,
    subcommunity_id TEXT,                                   -- Cohort org ID
    admin_invite_link TEXT,
    failure_reason  TEXT,                                   -- Only for failed status
    last_contacted_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts table — multiple contacts per organization
CREATE TABLE IF NOT EXISTS contacts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT,
    title           TEXT,                                   -- Manager, Proprietor, etc.
    email           TEXT,
    phone           TEXT,
    social          TEXT,                                   -- FB/LinkedIn/Insta links
    source          TEXT DEFAULT 'Google',                  -- Google, Website, Apollo, etc.
    send_enabled    BOOLEAN DEFAULT true,                   -- Human toggle: include in Instantly
    last_contacted_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events table — multiple events per organization
CREATE TABLE IF NOT EXISTS events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id          UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    status          TEXT DEFAULT 'new',                     -- new | ongoing | expired | pending | published | completed
    hind_status     TEXT DEFAULT 'pending',                 -- pending | published | completed
    event_date      TIMESTAMPTZ,
    location        TEXT,
    hind_url        TEXT,                                   -- turbo.cohort.social/... URL
    source_url      TEXT,                                   -- Original allevents.in / bookmyshow URL
    cohort_event_id TEXT,                                   -- UUID from Cohort API
    sent_on         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pipeline run log — records each URL processed and its outcome
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url      TEXT NOT NULL,
    org_id          UUID REFERENCES organizations(id),
    status          TEXT DEFAULT 'running',                 -- running | success | failed
    log             TEXT,                                   -- Full progress log
    error_message   TEXT,
    started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ============================================================
-- Indexes for common queries
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_city   ON organizations(city);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id      ON contacts(org_id);
CREATE INDEX IF NOT EXISTS idx_events_org_id        ON events(org_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs(status);

-- ============================================================
-- Auto-update updated_at on organizations
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
