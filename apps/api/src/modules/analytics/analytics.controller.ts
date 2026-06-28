import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { AnalyticsService } from './analytics.service';
import { UsersService } from '../users/users.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private analytics: AnalyticsService, private users: UsersService) {}

  @Get('dashboard') async getDashboard(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.analytics.getDashboardData(u.id); }
  @Get('pillars') async getPillarBreakdown(@CurrentUser() cu: CU, @Query('days') days = '30') { const u = await this.users.findByClerkId(cu.id); return this.analytics.getPillarBreakdown(u.id, parseInt(days,10)); }
}
