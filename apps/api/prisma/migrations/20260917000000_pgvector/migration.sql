-- Apply after the initial ContextOS schema migration.
CREATE EXTENSION IF NOT EXISTS vector;

-- Prisma represents this column as Unsupported("vector"); vector operations are isolated in VectorRepository.
ALTER TABLE "DocumentChunk" ADD COLUMN "embedding" vector(1536);

CREATE INDEX IF NOT EXISTS "DocumentChunk_embedding_hnsw_idx"
ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "Document_workspace_knowledgeBase_status_idx"
ON "Document" ("workspaceId", "knowledgeBaseId", status);
