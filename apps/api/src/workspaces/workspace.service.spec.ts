import { NotFoundException } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
describe('WorkspaceService tenancy', () => {
  it('lists only current user memberships', async () => {
    const prisma = {
      workspace: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { id: 'w1', name: 'Own', slug: 'own', members: [{ role: 'OWNER' }] },
          ]),
      },
    };
    const result = await new WorkspaceService(prisma as any).list('u1');
    expect(prisma.workspace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { members: { some: { userId: 'u1' } } } }),
    );
    expect(result).toEqual([{ id: 'w1', name: 'Own', slug: 'own', role: 'OWNER' }]);
  });
  it('blocks a foreign workspace before resource access', async () => {
    const service = new WorkspaceService({
      workspaceMember: { findUnique: jest.fn().mockResolvedValue(null) },
    } as any);
    await expect(service.assertMember('u1', 'foreign')).rejects.toBeInstanceOf(NotFoundException);
  });
});
