import { ChunkingService } from './chunking.service';
describe('ChunkingService', () => {
  const service = new ChunkingService();
  beforeEach(() => {
    Object.defineProperty(service, 'chunkSize', { value: 20 });
    Object.defineProperty(service, 'overlap', { value: 5 });
  });
  it('returns no chunks for empty content', () => expect(service.chunk('   ')).toEqual([]));
  it('creates a valid deterministic short chunk', () =>
    expect(service.chunk('short text')).toEqual([
      { ordinal: 0, content: 'short text', tokenCount: 2 },
    ]));
  it('creates ordered nonempty overlapping chunks for long text', () => {
    const first = service.chunk('one two three four five six seven eight nine ten eleven twelve');
    const second = service.chunk('one two three four five six seven eight nine ten eleven twelve');
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(1);
    expect(first.every((item) => item.content.length > 0)).toBe(true);
    expect(first[1].content).toContain(first[0].content.slice(-5).trim());
  });
});
