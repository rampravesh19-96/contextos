import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, type AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkspaceService } from '../workspaces/workspace.service';
import { PrismaService } from '../prisma/prisma.service';
class KnowledgeBaseDto {
  @IsString() @MinLength(2) @MaxLength(80) name!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
class UpdateKnowledgeBaseDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}
@UseGuards(SessionAuthGuard)
@Controller('workspaces/:workspaceId/knowledge-bases')
export class KnowledgeBasesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspaceService,
  ) {}
  @Get() async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    return this.prisma.knowledgeBase.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
    });
  }
  @Post() async create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Body() body: KnowledgeBaseDto,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN', 'MEMBER']);
    return this.prisma.knowledgeBase.create({
      data: { workspaceId, name: body.name.trim(), description: body.description?.trim() },
    });
  }
  @Get(':id') async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    const knowledgeBase = await this.prisma.knowledgeBase.findUnique({
      where: { id_workspaceId: { id, workspaceId } },
      include: { _count: { select: { documents: true } } },
    });
    if (!knowledgeBase) throw new NotFoundException('Knowledge base not found');
    return knowledgeBase;
  }
  @Patch(':id') async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: UpdateKnowledgeBaseDto,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN', 'MEMBER']);
    const existing = await this.prisma.knowledgeBase.findUnique({
      where: { id_workspaceId: { id, workspaceId } },
    });
    if (!existing) throw new NotFoundException('Knowledge base not found');
    return this.prisma.knowledgeBase.update({
      where: { id_workspaceId: { id, workspaceId } },
      data: {
        ...(body.name === undefined ? {} : { name: body.name.trim() }),
        ...(body.description === undefined ? {} : { description: body.description.trim() }),
      },
    });
  }
  @Delete(':id') async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN']);
    const result = await this.prisma.knowledgeBase.deleteMany({ where: { id, workspaceId } });
    if (!result.count) throw new NotFoundException('Knowledge base not found');
    return { ok: true };
  }
}
