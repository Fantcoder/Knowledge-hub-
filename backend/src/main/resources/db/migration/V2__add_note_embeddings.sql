-- ============================================================
-- Knowledge Hub — V2: Note Embeddings for AI Search
-- Stores vector embeddings for semantic search and RAG chat
-- ============================================================

CREATE TABLE IF NOT EXISTS note_embeddings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    note_id BIGINT NOT NULL UNIQUE,
    embedding_vector LONGTEXT NOT NULL,
    embedding_model VARCHAR(50) DEFAULT 'text-embedding-3-small',
    content_hash VARCHAR(64),
    vector_dimension INT DEFAULT 1536,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_embeddings_note_id ON note_embeddings(note_id);
CREATE INDEX idx_embeddings_content_hash ON note_embeddings(content_hash);
