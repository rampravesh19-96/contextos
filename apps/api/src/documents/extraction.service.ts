import { BadRequestException, Injectable } from '@nestjs/common';
import pdf from 'pdf-parse';

@Injectable()
export class ExtractionService {
  async extract(buffer: Buffer, mimeType: string, name: string): Promise<string> {
    if (!buffer.length) throw new BadRequestException('The uploaded file is empty.');
    let text: string;
    if (mimeType === 'application/pdf' || name.toLowerCase().endsWith('.pdf'))
      text = (await pdf(buffer)).text;
    else text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
    const normalized = text
      .replace(/\r\n?/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    if (normalized.length < 2)
      throw new BadRequestException('No usable text could be extracted from this document.');
    return normalized;
  }
}
