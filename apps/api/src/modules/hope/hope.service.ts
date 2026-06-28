import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HopeService {
  constructor(private prisma: PrismaService) {}

  async getGoals(userId: string) {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { milestones: { orderBy: { sortOrder: 'asc' } }, _count: { select: { checkIns: true } } },
    });
  }

  async createGoal(userId: string, data: any) {
    return this.prisma.goal.create({ data: { userId, ...data }, include: { milestones: true } });
  }

  async updateGoalProgress(goalId: string, progress: number, note?: string) {
    const [goal] = await Promise.all([
      this.prisma.goal.update({ where: { id: goalId }, data: { progress } }),
      this.prisma.goalCheckIn.create({ data: { goalId, progress, note } }),
    ]);
    return goal;
  }

  async addMilestone(goalId: string, title: string, dueDate?: Date) {
    return this.prisma.goalMilestone.create({ data: { goalId, title, dueDate } });
  }

  async completeMilestone(milestoneId: string) {
    return this.prisma.goalMilestone.update({
      where: { id: milestoneId },
      data: { isCompleted: true, completedAt: new Date() },
    });
  }
}
