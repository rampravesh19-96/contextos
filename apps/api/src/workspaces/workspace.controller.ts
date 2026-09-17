import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../auth/authenticated-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { WorkspaceService } from './workspace.service';

@UseGuards(SessionAuthGuard)
@Controller('workspaces')
export class WorkspaceController {
  constructor(private readonly workspaces: WorkspaceService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.workspaces.list(user.id);
  }

  @Get(':workspaceId')
  detail(@CurrentUser() user: AuthenticatedUser, @Param('workspaceId') workspaceId: string) {
    return this.workspaces.get(user.id, workspaceId);
  }
}
