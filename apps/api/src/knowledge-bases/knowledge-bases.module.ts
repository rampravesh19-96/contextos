import { Module } from '@nestjs/common';
import { KnowledgeBasesController } from './knowledge-bases.controller';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { AuthModule } from '../auth/auth.module';
@Module({ imports: [AuthModule, WorkspaceModule], controllers: [KnowledgeBasesController] })
export class KnowledgeBasesModule {}
