-- V3__add_performance_indexes.sql
-- Composite index for the main dashboard queries to eliminate filesorts
CREATE INDEX idx_notes_dashboard ON notes (user_id, is_deleted, is_archived, updated_at DESC);

-- Add content_preview column for cached text previews (performance optimization)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS content_preview VARCHAR(500) DEFAULT NULL;
