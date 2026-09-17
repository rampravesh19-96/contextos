import { BadRequestException } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
describe('ExtractionService', () => {
  const service = new ExtractionService();
  it('normalizes plain text whitespace and line endings', async () =>
    expect(
      await service.extract(Buffer.from(' hello   world\r\n\r\n\r\nnext '), 'text/plain', 'a.txt'),
    ).toBe('hello world\n\nnext'));
  it('fails safely for empty extracted content', async () =>
    await expect(
      service.extract(Buffer.from(' \n '), 'text/plain', 'a.txt'),
    ).rejects.toBeInstanceOf(BadRequestException));
});
