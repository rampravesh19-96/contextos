import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CurrentUser, type AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspaceService } from '../workspaces/workspace.service';
import { IngestionService } from './ingestion.service';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const supported = new Map([
  ['.pdf', 'application/pdf'],
  ['.txt', 'text/plain'],
  ['.md', 'text/markdown'],
  ['.markdown', 'text/markdown'],
]);
function extension(name: string) {
  return name.slice(name.lastIndexOf('.')).toLowerCase();
}
@UseGuards(SessionAuthGuard)
@Controller('workspaces/:workspaceId/documents')
export class DocumentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaces: WorkspaceService,
    private readonly ingestion: IngestionService,
  ) {}
  @Get() async list(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    return (this.prisma as any).document.findMany({
      where: { workspaceId },
      include: {
        knowledgeBase: { select: { id: true, name: true } },
        _count: { select: { chunks: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
  @Get(':id') async detail(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId);
    const document = await (this.prisma as any).document.findFirst({
      where: { id, workspaceId },
      include: { chunks: { select: { id: true, ordinal: true, content: true } } },
    });
    if (!document) throw new NotFoundException('Document not found');
    return document;
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Body('knowledgeBaseId') knowledgeBaseId: string,
    @UploadedFile() file?: { originalname: string; size: number; buffer: Buffer },
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN', 'MEMBER']);
    if (!file) throw new BadRequestException('A document file is required.');
    const mimeType = supported.get(extension(file.originalname));
    if (!mimeType || file.size === 0 || file.size > MAX_UPLOAD_BYTES)
      throw new BadRequestException(
        'Upload must be a non-empty PDF, TXT, or Markdown file up to 10 MB.',
      );
    const knowledgeBase = await (this.prisma as any).knowledgeBase.findUnique({
      where: { id_workspaceId: { id: knowledgeBaseId, workspaceId } },
    });
    if (!knowledgeBase) throw new NotFoundException('Knowledge base not found');
    const uploadRoot = resolve(process.env.UPLOAD_DIR ?? join(process.cwd(), 'uploads'));
    await mkdir(uploadRoot, { recursive: true });
    const storageKey = join(uploadRoot, `${randomUUID()}${extension(file.originalname)}`);
    await writeFile(storageKey, file.buffer);
    const document = await (this.prisma as any).document.create({
      data: {
        workspaceId,
        knowledgeBaseId,
        name: file.originalname,
        mimeType,
        storageKey,
        status: 'UPLOADED',
        metadata: { size: file.size },
      },
    });
    try {
      await this.ingestion.enqueue(document.id);
    } catch {
      /* status is deliberately FAILED by enqueue */
    }
    return document;
  }
  @Post(':id/retry') async retry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN', 'MEMBER']);
    const document = await (this.prisma as any).document.findFirst({ where: { id, workspaceId } });
    if (!document) throw new NotFoundException('Document not found');
    if (document.status !== 'FAILED')
      throw new BadRequestException('Only failed documents can be retried.');
    await (this.prisma as any).document.update({
      where: { id },
      data: { status: 'UPLOADED', errorMessage: null },
    });
    await this.ingestion.enqueue(id);
    return { ok: true };
  }
  @Delete(':id') async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    await this.workspaces.assertMember(user.id, workspaceId, ['OWNER', 'ADMIN']);
    const document = await (this.prisma as any).document.findFirst({ where: { id, workspaceId } });
    if (!document) throw new NotFoundException('Document not found');
    await (this.prisma as any).document.delete({ where: { id } });
    if (document.storageKey) await unlink(document.storageKey).catch(() => undefined);
    return { ok: true };
  }
}
