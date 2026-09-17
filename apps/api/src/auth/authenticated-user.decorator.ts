import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
}
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser =>
    ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>().user,
);
