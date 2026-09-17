import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspaces/workspace.module';
import { AnalyticsController } from './analytics.controller';
@Module({ imports: [WorkspaceModule], controllers: [AnalyticsController] })
export class AnalyticsModule {}
