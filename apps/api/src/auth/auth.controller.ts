import { Body, Controller, Get, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SESSION_COOKIE, SESSION_TTL_MS } from './session';
class SignInDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('sign-in') async signIn(
    @Body() body: SignInDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.signIn(body.email, body.password);
    res.cookie(SESSION_COOKIE, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_TTL_MS,
      path: '/',
    });
    return { user: result.user };
  }
  @Post('sign-out') async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.signOut(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { path: '/' });
    return { ok: true };
  }
  @Get('session') async session(@Req() req: Request) {
    const user = await this.auth.validate(req.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException();
    return { user: { id: user.id, email: user.email, name: user.name } };
  }
}
