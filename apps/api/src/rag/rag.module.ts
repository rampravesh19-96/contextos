import { Module } from '@nestjs/common';
import { EmbeddingService } from './embedding.service';
import { VectorRepository } from './vector.repository';
@Module({
  providers: [EmbeddingService, VectorRepository],
  exports: [EmbeddingService, VectorRepository],
})
export class RagModule {}
