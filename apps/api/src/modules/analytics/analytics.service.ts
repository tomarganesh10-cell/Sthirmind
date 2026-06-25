import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(userId: string) {
    const [scores, goals, habits, insights] = await Promise.all([
      this.prisma.dailyScore.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 30 }),
      this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE' }, include: { milestones: true } }),
      this.prisma.habit.findMany({ where: { userId, isActive: true }, include: { logs: { orderBy: { date: 'desc' }, take: 7 } } }),
      this.prisma.aiInsight.findMany({ where: { userId, isRead: false }, orderBy: { createdAt: 'desc' }, take: 5 }),
    ]);
    const latest = scores[0];
    return { scores, goals, habits, insights, latestScore: latest };
  }

  async getPillarBreakdown(userId: string, days = 30) {
    const from = new Date(); from.setDate(from.getDate() - days);
    const scores = await this.prisma.dailyScore.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });
    return scores.map(s => ({
      date: s.date,
      heart: s.heartScore,
      hope: s.hopeScore,
      health: s.healthScore,
      help: s.helpScore,
      total: s.totalScore,
    }));
  }
}
