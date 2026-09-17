import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SESSION_COOKIE } from './session';
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request & { user?: unknown }>();
    const user = await this.auth.validate(request.cookies?.[SESSION_COOKIE]);
    if (!user) throw new UnauthorizedException('A valid session is required');
    request.user = user;
    return true;
  }
}
