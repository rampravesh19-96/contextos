import { AuthController } from './auth.controller';

describe('AuthController cookie policy', () => {
  const originalOrigin = process.env.WEB_ORIGIN;
  const originalNodeEnv = process.env.NODE_ENV;
  afterEach(() => {
    if (originalOrigin === undefined) delete process.env.WEB_ORIGIN;
    else process.env.WEB_ORIGIN = originalOrigin;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  });
  it('sets a Secure SameSite=None cookie for an HTTPS deployed web origin', async () => {
    process.env.WEB_ORIGIN = 'https://contextos-two.vercel.app';
    delete process.env.NODE_ENV;
    const auth = { signIn: jest.fn().mockResolvedValue({ token: 'opaque', user: { id: 'u1' } }) };
    const res = { cookie: jest.fn() };
    await new AuthController(auth as any).signIn(
      { email: 'demo@example.com', password: 'password123' },
      res as any,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      expect.any(String),
      'opaque',
      expect.objectContaining({ httpOnly: true, secure: true, sameSite: 'none' }),
    );
  });
  it('keeps a local HTTP web origin on SameSite=Lax', async () => {
    process.env.WEB_ORIGIN = 'http://localhost:3000';
    process.env.NODE_ENV = 'development';
    const auth = { signIn: jest.fn().mockResolvedValue({ token: 'opaque', user: { id: 'u1' } }) };
    const res = { cookie: jest.fn() };
    await new AuthController(auth as any).signIn(
      { email: 'demo@example.com', password: 'password123' },
      res as any,
    );
    expect(res.cookie).toHaveBeenCalledWith(
      expect.any(String),
      'opaque',
      expect.objectContaining({ secure: false, sameSite: 'lax' }),
    );
  });
});
