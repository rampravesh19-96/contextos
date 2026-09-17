declare module 'pdf-parse' {
  export default function pdf(buffer: Buffer): Promise<{ text: string }>;
}
declare module 'bullmq' {
  export class Queue {
    constructor(name: string, options: unknown);
    add(name: string, data: unknown, options: unknown): Promise<unknown>;
    close(): Promise<void>;
  }
  export class Worker {
    constructor(
      name: string,
      processor: (job: { data: { documentId: string } }) => Promise<unknown>,
      options: unknown,
    );
    on(event: string, listener: (job: { id?: string } | undefined, error: Error) => void): void;
    close(): Promise<void>;
  }
}
