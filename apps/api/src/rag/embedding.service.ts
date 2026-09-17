import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class EmbeddingService {
  private readonly apiKey = process.env.LLM_API_KEY;
  private readonly baseUrl = process.env.LLM_BASE_URL ?? 'https://api.openai.com/v1';
  private readonly model = process.env.EMBEDDING_MODEL ?? 'text-embedding-3-small';
  isConfigured() {
    return Boolean(this.apiKey);
  }
  async embed(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      if (process.env.NODE_ENV === 'test') return texts.map((text) => this.deterministic(text));
      throw new ServiceUnavailableException('Embeddings require LLM_API_KEY configuration.');
    }
    const response = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { authorization: `Bearer ${this.apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: texts }),
    });
    if (!response.ok) throw new ServiceUnavailableException('Embedding provider request failed.');
    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((item) => item.embedding);
  }
  private deterministic(text: string) {
    const values = Array.from({ length: 16 }, () => 0);
    for (let i = 0; i < text.length; i += 1) values[i % values.length] += text.charCodeAt(i) / 255;
    const magnitude = Math.hypot(...values) || 1;
    return values.map((value) => value / magnitude);
  }
}
