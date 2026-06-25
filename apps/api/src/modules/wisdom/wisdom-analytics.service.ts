import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WisdomAnalyticsService {
  constructor(private prisma: PrismaService) {}

  async computeWisdomScore(userId: string): Promise<{
    knowledgeScore: number;
    consistencyScore: number;
    wisdomScore: number;
    breakdown: Record<string, number>;
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const [
      completedBooks,
      totalListening,
      notesCount,
      chatSessions,
      dailyWisdomOpened,
      streakDays,
    ] = await Promise.all([
      this.prisma.userBook.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.listeningSession.aggregate({ where: { userId, createdAt: { gte: thirtyDaysAgo } }, _sum: { durationSec: true } }),
      this.prisma.knowledgeNote.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.bookChatSession.count({ where: { userId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.dailyWisdom.count({ where: { userId, openedAt: { not: null }, date: { gte: thirtyDaysAgo as any } } }),
      this.getConsistencyStreak(userId),
    ]);

    const totalListeningMin = Math.round((totalListening._sum.durationSec ?? 0) / 60);

    // Knowledge Score (0-100): depth of learning
    const knowledgeScore = Math.min(100, Math.round(
      completedBooks * 8 +                    // 8 pts per completed book
      Math.min(40, totalListeningMin / 5) +   // up to 40 pts for listening
      notesCount * 2 +                        // 2 pts per note
      chatSessions * 3                        // 3 pts per book chat
    ));

    // Consistency Score (0-100): learning habit
    const consistencyScore = Math.min(100, Math.round(
      Math.min(50, streakDays * 5) +          // up to 50 for streak
      Math.min(30, dailyWisdomOpened * 3) +   // up to 30 for daily wisdom
      Math.min(20, notesCount)                // up to 20 for notes
    ));

    // Wisdom Score: composite of both
    const wisdomScore = Math.round(0.6 * knowledgeScore + 0.4 * consistencyScore);

    return {
      knowledgeScore,
      consistencyScore,
      wisdomScore,
      breakdown: {
        booksCompleted: completedBooks,
        totalListeningMin,
        notesCreated: notesCount,
        chatSessions,
        dailyWisdomStreak: streakDays,
        dailyWisdomOpened,
      },
    };
  }

  private async getConsistencyStreak(userId: string): Promise<number> {
    const recent = await this.prisma.wisdomAnalytic.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 60,
      select: { date: true, minutesListened: true, notesCreated: true },
    });

    let streak = 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    for (const entry of recent) {
      const d = new Date(entry.date); d.setHours(0, 0, 0, 0);
      const expected = new Date(today); expected.setDate(today.getDate() - streak);
      if (d.getTime() === expected.getTime() && (entry.minutesListened > 0 || entry.notesCreated > 0)) {
        streak++;
      } else break;
    }
    return streak;
  }

  async updateDailyAnalytics(userId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const scores = await this.computeWisdomScore(userId);

    await this.prisma.wisdomAnalytic.upsert({
      where: { userId_date: { userId, date: today } },
      create: {
        userId,
        date: today,
        knowledgeScore: scores.knowledgeScore,
        consistencyScore: scores.consistencyScore,
        wisdomScore: scores.wisdomScore,
        minutesListened: scores.breakdown.totalListeningMin,
        notesCreated: scores.breakdown.notesCreated,
      },
      update: {
        knowledgeScore: scores.knowledgeScore,
        consistencyScore: scores.consistencyScore,
        wisdomScore: scores.wisdomScore,
      },
    });

    return scores;
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.wisdomAnalytic.groupBy({
      by: ['userId'],
      _max: { wisdomScore: true },
      orderBy: { _max: { wisdomScore: 'desc' } },
      take: limit,
    });
  }
}
