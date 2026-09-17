import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { AuthModule } from '../auth/auth.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
@Module({
  imports: [AuthModule, WorkspaceModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
