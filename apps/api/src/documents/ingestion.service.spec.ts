import { IngestionService } from './ingestion.service';
describe('IngestionService', () => {
  function create() {
    const prisma = {
      document: { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}) },
      documentChunk: { deleteMany: jest.fn(), createMany: jest.fn(), findMany: jest.fn() },
    };
    return {
      prisma,
      service: new IngestionService(
        prisma as any,
        { extract: jest.fn() } as any,
        { chunk: jest.fn() } as any,
        { isConfigured: jest.fn().mockReturnValue(false) } as any,
        { saveEmbedding: jest.fn() } as any,
      ),
    };
  }
  it('marks a document failed when queue initialization/enqueue fails', async () => {
    const { service, prisma } = create();
    await expect(service.enqueue('d1')).rejects.toThrow('queue');
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
    );
  });
  it('marks extraction failure as FAILED after PROCESSING', async () => {
    const { service, prisma } = create();
    prisma.document.findUnique.mockResolvedValue({
      id: 'd1',
      workspaceId: 'w1',
      storageKey: null,
      name: 'a.txt',
      mimeType: 'text/plain',
      status: 'UPLOADED',
    });
    await expect(service.process('d1')).rejects.toThrow('source is unavailable');
    expect(prisma.document.update.mock.calls.map((call: any[]) => call[0].data.status)).toEqual([
      'PROCESSING',
      'FAILED',
    ]);
  });
  it('does not process a READY document twice', async () => {
    const { service, prisma } = create();
    prisma.document.findUnique.mockResolvedValue({ status: 'READY' });
    await service.process('d1');
    expect(prisma.document.update).not.toHaveBeenCalled();
  });
});
