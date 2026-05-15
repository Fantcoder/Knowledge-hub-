-- ============================================================
-- Knowledge Hub — V2: Note Embeddings for AI Search (PostgreSQL)
-- Stores local feature-hash vectors for semantic search / RAG
-- ============================================================


CREATE TABLE IF NOT EXISTS note_embeddings (
  id               BIGSERIAL    PRIMARY KEY,
  note_id          BIGINT       NOT NULL UNIQUE REFERENCES notes(id) ON DELETE CASCADE,
  embedding_vector TEXT         NOT NULL,
  embedding_model  VARCHAR(50)  NOT NULL DEFAULT 'local-feature-hash-v1',
  content_hash     VARCHAR(64),
  vector_dimension INT          NOT NULL DEFAULT 512,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Reuse the trigger function created in V1
CREATE TRIGGER note_embeddings_updated_at
  BEFORE UPDATE ON note_embeddings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_embeddings_note_id      ON note_embeddings(note_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_content_hash ON note_embeddings(content_hash);
