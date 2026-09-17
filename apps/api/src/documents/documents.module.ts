import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { AuthModule } from '../auth/auth.module';
import { RagModule } from '../rag/rag.module';
import { ChunkingService } from './chunking.service';
import { DocumentsController } from './documents.controller';
import { ExtractionService } from './extraction.service';
import { IngestionService } from './ingestion.service';
@Module({
  imports: [AuthModule, WorkspaceModule, RagModule],
  controllers: [DocumentsController],
  providers: [ChunkingService, ExtractionService, IngestionService],
  exports: [ChunkingService],
})
export class DocumentsModule {}
