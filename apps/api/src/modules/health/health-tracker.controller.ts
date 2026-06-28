import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { HealthTrackerService } from './health-tracker.service';
import { UsersService } from '../users/users.service';

@ApiTags('Health')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('health')
export class HealthTrackerController {
  constructor(private health: HealthTrackerService, private users: UsersService) {}

  @Get('profile') async getProfile(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.health.getProfile(u.id); }
  @Post('profile') async upsertProfile(@CurrentUser() cu: CU, @Body() body: any) { const u = await this.users.findByClerkId(cu.id); return this.health.upsertProfile(u.id, body); }
  @Post('log') async logToday(@CurrentUser() cu: CU, @Body() body: any) { const u = await this.users.findByClerkId(cu.id); return this.health.logToday(u.id, body); }
  @Get('log') async getHistory(@CurrentUser() cu: CU, @Query('days') days = '30') { const u = await this.users.findByClerkId(cu.id); return this.health.getHistory(u.id, parseInt(days,10)); }
  @Get('habits') async getHabits(@CurrentUser() cu: CU) { const u = await this.users.findByClerkId(cu.id); return this.health.getHabits(u.id); }
  @Post('habits') async createHabit(@CurrentUser() cu: CU, @Body() body: any) { const u = await this.users.findByClerkId(cu.id); return this.health.createHabit(u.id, body); }
  @Post('habits/:id/log') async logHabit(@Param('id') id: string) { return this.health.logHabit(id); }
}
