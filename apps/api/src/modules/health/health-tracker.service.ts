import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthTrackerService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    return this.prisma.healthProfile.findUnique({ where: { userId } });
  }

  async upsertProfile(userId: string, data: any) {
    return this.prisma.healthProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
  }

  async logToday(userId: string, data: any) {
    const date = new Date(); date.setHours(0,0,0,0);
    return this.prisma.healthLog.upsert({
      where: { userId_date: { userId, date } },
      create: { userId, date, ...data },
      update: data,
    });
  }

  async getHistory(userId: string, days = 30) {
    const from = new Date(); from.setDate(from.getDate() - days);
    return this.prisma.healthLog.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'desc' },
    });
  }

  async getHabits(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId, isActive: true },
      include: { logs: { where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } } } },
    });
  }

  async createHabit(userId: string, data: any) {
    return this.prisma.habit.create({ data: { userId, ...data } });
  }

  async logHabit(habitId: string) {
    const date = new Date(); date.setHours(0,0,0,0);
    const log = await this.prisma.habitLog.upsert({
      where: { habitId_date: { habitId, date } },
      create: { habitId, date },
      update: { count: { increment: 1 } },
    });
    // Update streak
    await this.prisma.habit.update({
      where: { id: habitId },
      data: { streak: { increment: 1 } },
    });
    return log;
  }
}
