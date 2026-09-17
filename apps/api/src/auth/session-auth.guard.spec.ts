import { UnauthorizedException } from '@nestjs/common';
import { SessionAuthGuard } from './session-auth.guard';
describe('SessionAuthGuard', () => {
  const request: { cookies: Record<string, string>; user?: unknown } = { cookies: {} };
  const context = { switchToHttp: () => ({ getRequest: () => request }) } as any;
  it.each([undefined, 'invalid'])('rejects missing or invalid sessions', async (token) => {
    request.cookies = token ? { contextos_session: token } : {};
    const guard = new SessionAuthGuard({ validate: jest.fn().mockResolvedValue(null) } as any);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
  it('rejects expired sessions and attaches a valid authenticated user', async () => {
    const auth = {
      validate: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'u1', email: 'u@test.dev', name: null }),
    };
    const guard = new SessionAuthGuard(auth as any);
    request.cookies = { contextos_session: 'expired' };
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    request.cookies = { contextos_session: 'valid' };
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.user).toEqual({ id: 'u1', email: 'u@test.dev', name: null });
  });
});
