import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export type RetrievedChunk = {
  id: string;
  content: string;
  ordinal: number;
  documentId: string;
  documentName: string;
  score: number;
};
@Injectable()
export class VectorRepository {
  constructor(private readonly prisma: PrismaService) {}
  async saveEmbedding(chunkId: string, embedding: number[]) {
    const vector = `[${embedding.join(',')}]`;
    await (this.prisma as any)
      .$executeRaw`UPDATE "DocumentChunk" SET embedding = ${vector}::vector WHERE id = ${chunkId}`;
  }
  async search(
    workspaceId: string,
    knowledgeBaseId: string | undefined,
    embedding: number[],
    limit = 6,
  ): Promise<RetrievedChunk[]> {
    const vector = `[${embedding.join(',')}]`;
    return (this.prisma as any).$queryRaw`
      SELECT c.id, c.content, c.ordinal, c."documentId", d.name AS "documentName", 1 - (c.embedding <=> ${vector}::vector) AS score
      FROM "DocumentChunk" c JOIN "Document" d ON d.id = c."documentId"
      WHERE c."workspaceId" = ${workspaceId} AND d.status = 'READY'
      AND (${knowledgeBaseId ?? null}::text IS NULL OR d."knowledgeBaseId" = ${knowledgeBaseId ?? null})
      AND c.embedding IS NOT NULL ORDER BY c.embedding <=> ${vector}::vector ASC LIMIT ${limit}`;
  }
}
