import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Response } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspaces/workspace.service';
import { ChatService } from './chat.service';
class CreateConversationDto {
  @IsOptional() @IsString() knowledgeBaseId?: string;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
}
class SendMessageDto {
  @IsString() @MinLength(1) @MaxLength(8000) content!: string;
}
@UseGuards(SessionAuthGuard)
@Controller('workspaces/:workspaceId/conversations')
export class ChatController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspaceService,
    private readonly chat: ChatService,
  ) {}
  @Get() async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    return (this.prisma as any).conversation.findMany({
      where: { workspaceId, userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });
  }
  @Post() async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateConversationDto,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    if (body.knowledgeBaseId) {
      const kb = await (this.prisma as any).knowledgeBase.findUnique({
        where: { id_workspaceId: { id: body.knowledgeBaseId, workspaceId } },
      });
      if (!kb) throw new Error('Knowledge base not found');
    }
    return (this.prisma as any).conversation.create({
      data: {
        workspaceId,
        knowledgeBaseId: body.knowledgeBaseId,
        userId: user.id,
        title: body.title,
      },
    });
  }
  @Get(':id') async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    return (this.prisma as any).conversation.findFirstOrThrow({
      where: { id, workspaceId, userId: user.id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }
  @Post(':id/messages/stream') async message(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: SendMessageDto,
    @Res() res: Response,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    const conversation = await (this.prisma as any).conversation.findFirst({
      where: { id, workspaceId, userId: user.id },
    });
    if (!conversation) {
      res.status(404).json({ message: 'Conversation not found' });
      return;
    }
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const write = (event: string, data: unknown) =>
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      await this.chat.stream(
        workspaceId,
        conversation.knowledgeBaseId,
        id,
        user.id,
        body.content,
        write,
      );
    } catch (error) {
      write('error', { message: error instanceof Error ? error.message : 'Chat failed.' });
    } finally {
      res.end();
    }
  }
}
