import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { HappinessService } from './happiness.service';
import { CheckinDto } from './dto/checkin.dto';
import { UsersService } from '../users/users.service';

@ApiTags('Happiness')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('happiness')
export class HappinessController {
  constructor(
    private happiness: HappinessService,
    private users: UsersService,
  ) {}

  @Post('checkin')
  async checkin(@CurrentUser() cu: CU, @Body() dto: CheckinDto) {
    const user = await this.users.findByClerkId(cu.id);
    return this.happiness.computeAndStoreDailyScore(user.id, dto);
  }

  @Get('today')
  async getToday(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.happiness.getTodayScore(user.id);
  }

  @Get('history')
  @ApiQuery({ name: 'days', required: false })
  async getHistory(@CurrentUser() cu: CU, @Query('days') days = '30') {
    const user = await this.users.findByClerkId(cu.id);
    return this.happiness.getScoreHistory(user.id, parseInt(days, 10));
  }

  @Get('weekly-report')
  async getWeeklyReport(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.happiness.getLatestWeeklyReport(user.id);
  }
}
