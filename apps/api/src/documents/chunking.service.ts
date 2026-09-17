import { Injectable } from '@nestjs/common';

export type TextChunk = { ordinal: number; content: string; tokenCount: number };
@Injectable()
export class ChunkingService {
  readonly chunkSize = Number(process.env.CHUNK_SIZE ?? 1200);
  readonly overlap = Number(process.env.CHUNK_OVERLAP ?? 180);
  chunk(text: string): TextChunk[] {
    const normalized = text.trim();
    if (!normalized) return [];
    const chunks: TextChunk[] = [];
    let start = 0;
    while (start < normalized.length) {
      const end = Math.min(normalized.length, start + this.chunkSize);
      let content = normalized.slice(start, end);
      if (end < normalized.length) {
        const breakAt = Math.max(
          content.lastIndexOf('\n'),
          content.lastIndexOf('. '),
          content.lastIndexOf(' '),
        );
        if (breakAt > this.chunkSize * 0.55) content = content.slice(0, breakAt + 1);
      }
      content = content.trim();
      if (content)
        chunks.push({ ordinal: chunks.length, content, tokenCount: content.split(/\s+/).length });
      if (end === normalized.length) break;
      start += Math.max(1, content.length - this.overlap);
    }
    return chunks;
  }
}
