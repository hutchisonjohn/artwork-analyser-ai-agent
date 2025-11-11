CREATE TABLE IF NOT EXISTS doc_chunks (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  embedding TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doc_chunks_source ON doc_chunks (source);
CREATE INDEX IF NOT EXISTS idx_doc_chunks_updated_at ON doc_chunks (updated_at DESC);
