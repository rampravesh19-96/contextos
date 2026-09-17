import { AuthService } from './auth.service';
import { hashPassword } from './session';
describe('AuthService', () => {
  it('invalidates the persisted opaque token on sign-out', async () => {
    const prisma = { session: { deleteMany: jest.fn().mockResolvedValue({ count: 1 }) } };
    const service = new AuthService(prisma as any);
    await service.signOut('opaque-token');
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String) },
    });
  });
  it('authenticates a valid password and stores only a hashed session token', async () => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'u1',
          email: 'demo@test.dev',
          name: null,
          passwordHash: hashPassword('password123'),
        }),
      },
      session: { create: jest.fn() },
    };
    const result = await new AuthService(prisma as any).signIn('DEMO@test.dev', 'password123');
    expect(result.token).toBeTruthy();
    expect(prisma.session.create.mock.calls[0][0].data.tokenHash).not.toBe(result.token);
  });
});
