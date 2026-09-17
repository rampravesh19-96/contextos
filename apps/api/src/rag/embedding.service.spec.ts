import { EmbeddingService } from './embedding.service';
describe('EmbeddingService', () => {
  it('uses a deterministic test-only embedding fallback', async () => {
    delete process.env.LLM_API_KEY;
    const original = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', configurable: true });
    expect(await new EmbeddingService().embed(['same', 'same'])).toEqual([
      expect.any(Array),
      expect.any(Array),
    ]);
    Object.defineProperty(process.env, 'NODE_ENV', { value: original, configurable: true });
  });
});
