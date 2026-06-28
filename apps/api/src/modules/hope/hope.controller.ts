import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { HopeService } from './hope.service';
import { UsersService } from '../users/users.service';

@ApiTags('Hope')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('hope')
export class HopeController {
  constructor(private hope: HopeService, private users: UsersService) {}

  @Get('goals')
  async getGoals(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.hope.getGoals(user.id);
  }

  @Post('goals')
  async createGoal(@CurrentUser() cu: CU, @Body() body: any) {
    const user = await this.users.findByClerkId(cu.id);
    return this.hope.createGoal(user.id, body);
  }

  @Patch('goals/:id/progress')
  async updateProgress(@Param('id') id: string, @Body() body: { progress: number; note?: string }) {
    return this.hope.updateGoalProgress(id, body.progress, body.note);
  }

  @Post('goals/:id/milestones')
  async addMilestone(@Param('id') id: string, @Body() body: { title: string; dueDate?: string }) {
    return this.hope.addMilestone(id, body.title, body.dueDate ? new Date(body.dueDate) : undefined);
  }

  @Patch('milestones/:id/complete')
  async completeMilestone(@Param('id') id: string) {
    return this.hope.completeMilestone(id);
  }
}
