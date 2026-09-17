import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspaces/workspace.service';
@UseGuards(SessionAuthGuard)
@Controller('workspaces/:workspaceId/analytics')
export class AnalyticsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspaceService,
  ) {}
  @Get() async overview(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    const db = this.prisma as any;
    const [knowledgeBases, documents, readyDocuments, conversations, aiRequests, recent] =
      await Promise.all([
        db.knowledgeBase.count({ where: { workspaceId } }),
        db.document.count({ where: { workspaceId } }),
        db.document.count({ where: { workspaceId, status: 'READY' } }),
        db.conversation.count({ where: { workspaceId } }),
        db.aiUsageEvent.count({ where: { workspaceId } }),
        db.aiUsageEvent.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);
    return { knowledgeBases, documents, readyDocuments, conversations, aiRequests, recent };
  }
}
