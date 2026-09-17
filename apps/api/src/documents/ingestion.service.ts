import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { readFile } from 'node:fs/promises';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkingService } from './chunking.service';
import { ExtractionService } from './extraction.service';
import { EmbeddingService } from '../rag/embedding.service';
import { VectorRepository } from '../rag/vector.repository';

@Injectable()
export class IngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  private queue?: Queue;
  private worker?: Worker;
  constructor(
    private readonly prisma: PrismaService,
    private readonly extraction: ExtractionService,
    private readonly chunking: ChunkingService,
    private readonly embeddings: EmbeddingService,
    private readonly vectors: VectorRepository,
  ) {}
  onModuleInit() {
    const connection = { url: process.env.REDIS_URL };
    this.queue = new Queue('document-ingestion', { connection });
    this.worker = new Worker(
      'document-ingestion',
      async (job) => this.process(job.data.documentId),
      { connection, concurrency: 2 },
    );
    this.worker.on('failed', (job, error) =>
      this.logger.warn(`Ingestion job ${job?.id ?? 'unknown'} failed: ${error.message}`),
    );
  }
  async enqueue(documentId: string) {
    try {
      if (!this.queue) throw new Error('Ingestion queue has not been initialized.');
      await this.queue?.add(
        'ingest',
        { documentId },
        {
          jobId: documentId,
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
        },
      );
    } catch (error) {
      await (this.prisma as any).document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: 'Ingestion queue is unavailable. Start Redis and retry this document.',
        },
      });
      throw error;
    }
  }
  async process(documentId: string) {
    const db = this.prisma as any;
    const document = await db.document.findUnique({ where: { id: documentId } });
    if (!document || document.status === 'READY') return;
    try {
      await db.document.update({
        where: { id: documentId },
        data: { status: 'PROCESSING', errorMessage: null },
      });
      if (!document.storageKey) throw new Error('Document source is unavailable.');
      const content = await this.extraction.extract(
        await readFile(document.storageKey),
        document.mimeType ?? '',
        document.name,
      );
      const chunks = this.chunking.chunk(content);
      if (!chunks.length) throw new Error('No usable chunks were produced.');
      await db.documentChunk.deleteMany({ where: { documentId } });
      await db.documentChunk.createMany({
        data: chunks.map((chunk) => ({
          workspaceId: document.workspaceId,
          documentId,
          ordinal: chunk.ordinal,
          content: chunk.content,
          tokenCount: chunk.tokenCount,
          metadata: { sourceName: document.name },
        })),
      });
      const stored = await db.documentChunk.findMany({
        where: { documentId },
        orderBy: { ordinal: 'asc' },
        select: { id: true, content: true },
      });
      const vectors = await this.embeddings.embed(
        stored.map((chunk: { content: string }) => chunk.content),
      );
      if (vectors.length !== stored.length || vectors.some((vector) => !vector.length))
        throw new Error('Embedding provider returned an incomplete embedding response.');
      await Promise.all(
        stored.map((chunk: { id: string }, index: number) =>
          this.vectors.saveEmbedding(chunk.id, vectors[index]),
        ),
      );
      await db.document.update({
        where: { id: documentId },
        data: { status: 'READY', errorMessage: null },
      });
    } catch (error) {
      await db.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Ingestion failed.',
        },
      });
      throw error;
    }
  }
  async onModuleDestroy() {
    await this.worker?.close();
    await this.queue?.close();
  }
}
