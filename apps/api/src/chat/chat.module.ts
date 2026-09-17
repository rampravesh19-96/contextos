import { Module } from '@nestjs/common';
import { RagModule } from '../rag/rag.module';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
@Module({
  imports: [WorkspaceModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
