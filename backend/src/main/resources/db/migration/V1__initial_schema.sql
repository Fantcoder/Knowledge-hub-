-- ============================================================
-- Knowledge Hub — V1 Baseline Schema (PostgreSQL / Neon)
-- Flyway migration: initial database structure
-- ============================================================

-- ── Trigger function for updated_at auto-update ─────────────
-- PostgreSQL does not have ON UPDATE CURRENT_TIMESTAMP.
-- This trigger function replicates that behaviour for all tables.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         BIGSERIAL PRIMARY KEY,
  username   VARCHAR(50)  NOT NULL UNIQUE,
  email      VARCHAR(100) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Notes ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id              BIGSERIAL    PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT,
  content_preview TEXT,
  is_pinned       BOOLEAN      NOT NULL DEFAULT FALSE,
  is_archived     BOOLEAN      NOT NULL DEFAULT FALSE,
  is_deleted      BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  user_id         BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Tags ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tags (
  id      BIGSERIAL    PRIMARY KEY,
  name    VARCHAR(50)  NOT NULL,
  user_id BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE (name, user_id)
);

-- ── Note–Tags join ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS note_tags (
  note_id BIGINT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  tag_id  BIGINT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- ── Files ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS files (
  id            BIGSERIAL    PRIMARY KEY,
  original_name VARCHAR(255),
  stored_name   VARCHAR(255) NOT NULL UNIQUE,
  file_type     VARCHAR(50),
  file_size     BIGINT,
  file_path     VARCHAR(500),
  upload_date   TIMESTAMP    NOT NULL DEFAULT NOW(),
  note_id       BIGINT       REFERENCES notes(id) ON DELETE SET NULL,
  user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- ── Links ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS links (
  id          BIGSERIAL    PRIMARY KEY,
  url         TEXT         NOT NULL,
  title       VARCHAR(255),
  description TEXT,
  favicon_url VARCHAR(500),
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  note_id     BIGINT       REFERENCES notes(id) ON DELETE SET NULL
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_user_id    ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted  ON notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_tags_user_id      ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id     ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id     ON links(user_id);
