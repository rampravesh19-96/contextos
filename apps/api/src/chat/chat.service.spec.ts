import { ServiceUnavailableException } from '@nestjs/common';
import { ChatService } from './chat.service';
describe('ChatService', () => {
  it('does not persist a user message or fabricate citations without an API key', async () => {
    const original = process.env.LLM_API_KEY;
    delete process.env.LLM_API_KEY;
    const prisma = { message: { create: jest.fn() } };
    const service = new ChatService(
      prisma as any,
      { embed: jest.fn() } as any,
      { search: jest.fn() } as any,
    );
    await expect(
      service.stream('w1', undefined, 'c1', 'u1', 'question', jest.fn()),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(prisma.message.create).not.toHaveBeenCalled();
    if (original) process.env.LLM_API_KEY = original;
  });
  it('passes authorized workspace and knowledge base to retrieval', async () => {
    const original = process.env.LLM_API_KEY;
    process.env.LLM_API_KEY = 'test-key';
    const encoder = new TextEncoder();
    const response = {
      ok: true,
      body: new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(
              'data: {"choices":[{"delta":{"content":"Grounded"}}]}\n\ndata: [DONE]\n\n',
            ),
          );
          controller.close();
        },
      }),
    };
    global.fetch = jest.fn().mockResolvedValue(response) as any;
    const prisma = {
      message: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
      aiUsageEvent: { create: jest.fn() },
    };
    const vectors = {
      search: jest.fn().mockResolvedValue([
        {
          id: 'chunk-own',
          content: 'Only own context',
          ordinal: 0,
          documentId: 'd1',
          documentName: 'own.txt',
          score: 0.9,
        },
      ]),
    };
    await new ChatService(
      prisma as any,
      { embed: jest.fn().mockResolvedValue([[1]]) } as any,
      vectors as any,
    ).stream('w-own', 'kb-own', 'c1', 'u1', 'q', jest.fn());
    expect(vectors.search).toHaveBeenCalledWith('w-own', 'kb-own', [1]);
    expect(prisma.message.create.mock.calls[1][0].data.citations[0].chunkId).toBe('chunk-own');
    if (original) process.env.LLM_API_KEY = original;
    else delete process.env.LLM_API_KEY;
  });
});
