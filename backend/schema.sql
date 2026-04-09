-- ============================================================
-- Knowledge Hub — Full PostgreSQL Schema (Neon)
-- FOR REFERENCE ONLY — Flyway manages actual schema via:
--   V1__initial_schema.sql
--   V2__add_note_embeddings.sql
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
  id         BIGSERIAL    PRIMARY KEY,
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
  user_id     BIGINT       NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
  note_id     BIGINT       REFERENCES notes(id) ON DELETE SET NULL
);

-- ── Note Embeddings (AI semantic search) ─────────────────────
CREATE TABLE IF NOT EXISTS note_embeddings (
  id               BIGSERIAL    PRIMARY KEY,
  note_id          BIGINT       NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
  embedding_vector TEXT         NOT NULL,          -- comma-separated float32 values
  embedding_model  VARCHAR(50)  NOT NULL DEFAULT 'local-feature-hash-v1',
  content_hash     VARCHAR(64),
  vector_dimension INT          NOT NULL DEFAULT 512,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TRIGGER note_embeddings_updated_at
  BEFORE UPDATE ON note_embeddings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notes_user_id         ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_deleted      ON notes(is_deleted);
CREATE INDEX IF NOT EXISTS idx_notes_is_archived     ON notes(is_archived);
CREATE INDEX IF NOT EXISTS idx_tags_user_id          ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_files_user_id         ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_links_user_id         ON links(user_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_note_id    ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_hash ON note_embeddings(content_hash);
