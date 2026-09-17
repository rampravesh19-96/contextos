import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createSessionToken, hashToken, SESSION_TTL_MS, verifyPassword } from './session';
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}
  async signIn(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user || !verifyPassword(password, user.passwordHash))
      throw new UnauthorizedException('Invalid email or password');
    const token = createSessionToken();
    await this.prisma.session.create({
      data: {
        tokenHash: hashToken(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      },
    });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }
  async validate(token?: string) {
    if (!token) return null;
    const session = await this.prisma.session.findFirst({
      where: { tokenHash: hashToken(token), expiresAt: { gt: new Date() } },
      include: { user: true },
    });
    return session?.user ?? null;
  }
  async signOut(token?: string) {
    if (token) await this.prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
}
