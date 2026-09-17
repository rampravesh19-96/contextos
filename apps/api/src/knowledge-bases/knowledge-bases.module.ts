import { Module } from '@nestjs/common';
import { KnowledgeBasesController } from './knowledge-bases.controller';
import { WorkspaceModule } from '../workspaces/workspace.module';
@Module({ imports: [WorkspaceModule], controllers: [KnowledgeBasesController] })
export class KnowledgeBasesModule {}
