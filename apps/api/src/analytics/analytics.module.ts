import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
@Module({ imports: [AuthModule, WorkspaceModule], controllers: [AnalyticsController] })
export class AnalyticsModule {}
