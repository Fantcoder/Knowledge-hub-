-- ============================================================
-- Knowledge Hub — V3: Shared Notes (PostgreSQL)
-- Adds sharing capability for public, read-only note links
-- ============================================================

ALTER TABLE notes ADD COLUMN IF NOT EXISTS share_slug VARCHAR(16) UNIQUE;
ALTER TABLE notes ADD COLUMN IF NOT EXISTS is_shared BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_notes_share_slug ON notes(share_slug);
