import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER';
@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}
  async assertMember(userId: string, workspaceId: string, roles?: Role[]) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new NotFoundException('Workspace not found');
    if (roles && !roles.includes(member.role as Role))
      throw new ForbiddenException('Insufficient workspace role');
    return member;
  }
  async list(userId: string) {
    const workspaces = await this.prisma.workspace.findMany({
      where: { members: { some: { userId } } },
      select: {
        id: true,
        name: true,
        slug: true,
        members: { where: { userId }, select: { role: true } },
      },
    });
    return workspaces.map(({ members, ...workspace }) => ({
      ...workspace,
      role: members[0]?.role,
    }));
  }
  async get(userId: string, workspaceId: string) {
    const member = await this.assertMember(userId, workspaceId);
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, name: true, slug: true, createdAt: true, updatedAt: true },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return { ...workspace, role: member.role };
  }
}
