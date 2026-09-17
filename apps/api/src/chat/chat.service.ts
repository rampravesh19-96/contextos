import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { EmbeddingService } from '../rag/embedding.service';
import { VectorRepository, type RetrievedChunk } from '../rag/vector.repository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly embeddings: EmbeddingService,
    private readonly vectors: VectorRepository,
  ) {}
  async stream(
    workspaceId: string,
    knowledgeBaseId: string | undefined,
    conversationId: string,
    userId: string,
    prompt: string,
    write: (event: string, data: unknown) => void,
  ) {
    if (!process.env.LLM_API_KEY)
      throw new ServiceUnavailableException('Chat requires LLM_API_KEY configuration.');
    const [query] = await this.embeddings.embed([prompt]);
    const chunks = await this.vectors.search(workspaceId, knowledgeBaseId, query);
    const citations = chunks.map((chunk) => ({
      documentId: chunk.documentId,
      documentName: chunk.documentName,
      chunkId: chunk.id,
      ordinal: chunk.ordinal,
      excerpt: chunk.content.slice(0, 240),
    }));
    await (this.prisma as any).message.create({
      data: { conversationId, role: 'USER', content: prompt },
    });
    const context = chunks.map((chunk, index) => `[${index + 1}] ${chunk.content}`).join('\n\n');
    const response = await fetch(
      `${process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1'}/chat/completions`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${process.env.LLM_API_KEY}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                'Answer only from the supplied context. If it is insufficient, say so. Cite sources by their bracket number.',
            },
            {
              role: 'user',
              content: `Context:\n${context || '(No retrieved context)'}\n\nQuestion: ${prompt}`,
            },
          ],
        }),
      },
    );
    if (!response.ok || !response.body)
      throw new ServiceUnavailableException('Chat provider request failed.');
    let answer = '';
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      buffer += decoder.decode(next.value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const token = (
            JSON.parse(payload) as { choices?: Array<{ delta?: { content?: string } }> }
          ).choices?.[0]?.delta?.content;
          if (token) {
            answer += token;
            write('token', { token });
          }
        } catch {
          /* provider keepalive */
        }
      }
    }
    const assistant = await (this.prisma as any).message.create({
      data: { conversationId, role: 'ASSISTANT', content: answer, citations },
    });
    await (this.prisma as any).aiUsageEvent.create({
      data: {
        workspaceId,
        userId,
        provider: 'openai-compatible',
        model: process.env.LLM_MODEL ?? 'gpt-4o-mini',
        operation: 'chat',
        inputTokens: 0,
        outputTokens: 0,
        metadata: { metricsAvailable: false },
      },
    });
    write('done', { messageId: assistant.id, citations });
  }
}
