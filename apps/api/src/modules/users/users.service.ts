import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOrCreate(clerkId: string, data: { email: string; firstName?: string; lastName?: string; imageUrl?: string }) {
    return this.prisma.user.upsert({
      where: { clerkId },
      create: {
        clerkId,
        ...data,
        profile: { create: {} },
        xp: { create: {} },
        impactProfile: { create: {} },
      },
      update: { ...data },
      include: { profile: true, xp: true },
    });
  }

  async findByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: { profile: true, xp: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }

  async getStats(userId: string) {
    const [goals, habits, journalCount, streak] = await Promise.all([
      this.prisma.goal.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.habit.count({ where: { userId, isActive: true } }),
      this.prisma.journalEntry.count({ where: { userId } }),
      this.getCheckInStreak(userId),
    ]);
    return { activeGoals: goals, activeHabits: habits, journalEntries: journalCount, checkInStreak: streak };
  }

  private async getCheckInStreak(userId: string): Promise<number> {
    const scores = await this.prisma.dailyScore.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 90,
      select: { date: true },
    });
    if (!scores.length) return 0;
    let streak = 0;
    let expectedDate = new Date();
    expectedDate.setHours(0, 0, 0, 0);
    for (const s of scores) {
      const d = new Date(s.date);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === expectedDate.getTime()) {
        streak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else break;
    }
    return streak;
  }
}
