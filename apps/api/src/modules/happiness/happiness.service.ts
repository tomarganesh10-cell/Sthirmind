import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';

/**
 * HAPPINESS ENGINE
 * Mathematical model for computing the 5H Happiness Score.
 *
 * Formula:
 *   H_score = w_heart·Heart + w_hope·Hope + w_health·Health + w_help·Help
 *
 * Weights (evidence-based, Seligman PERMA + WHO-5):
 *   Heart  = 0.28  (relationships are the strongest happiness predictor)
 *   Hope   = 0.25  (purpose + meaning)
 *   Health = 0.27  (physical + mental foundation)
 *   Help   = 0.20  (contribution + belonging)
 *
 * Each pillar score is independently computed from sub-dimensions.
 * Scores are 0–100. Happiness Score = weighted composite.
 */

const WEIGHTS = { heart: 0.28, hope: 0.25, health: 0.27, help: 0.20 };

export interface PillarScores {
  heart: number;
  hope: number;
  health: number;
  help: number;
}

export interface HappinessBreakdown {
  happiness: number;
  heart: number;
  hope: number;
  health: number;
  help: number;
  tier: 'struggling' | 'developing' | 'flourishing' | 'thriving';
  weakestPillar: string;
  strongestPillar: string;
  balanceIndex: number;
  momentumScore: number;
}

@Injectable()
export class HappinessService {
  constructor(private readonly prisma: PrismaService) {}

  computeHappiness(pillar: PillarScores): HappinessBreakdown {
    const happiness = Math.min(100, Math.round(
      WEIGHTS.heart * pillar.heart +
      WEIGHTS.hope  * pillar.hope  +
      WEIGHTS.health * pillar.health +
      WEIGHTS.help  * pillar.help,
    ));

    const pillars = { heart: pillar.heart, hope: pillar.hope, health: pillar.health, help: pillar.help };
    const entries = Object.entries(pillars);
    const weakest = entries.reduce((a, b) => b[1] < a[1] ? b : a);
    const strongest = entries.reduce((a, b) => b[1] > a[1] ? b : a);

    // Balance index: how evenly distributed are the scores (0=imbalanced, 100=balanced)
    const mean = (pillar.heart + pillar.hope + pillar.health + pillar.help) / 4;
    const variance = entries.reduce((acc, [, v]) => acc + Math.pow(v - mean, 2), 0) / 4;
    const balanceIndex = Math.max(0, Math.round(100 - Math.sqrt(variance)));

    const tier = happiness >= 80 ? 'thriving'
      : happiness >= 60 ? 'flourishing'
      : happiness >= 40 ? 'developing'
      : 'struggling';

    return {
      happiness,
      ...pillar,
      tier,
      weakestPillar: weakest[0],
      strongestPillar: strongest[0],
      balanceIndex,
      momentumScore: 0,  // computed separately from trend data
    };
  }

  computeHeartScore(data: {
    relationshipCount: number;
    avgRelationshipHealth: number;
    recentInteractions: number;
    journalDaysThisWeek: number;
    gratitudeEntriesToday: number;
    avgMoodWeek: number;
    emotionalIq?: number;
  }): number {
    const weights = {
      relationshipHealth: 0.30,
      interactions: 0.20,
      journaling: 0.15,
      gratitude: 0.15,
      mood: 0.10,
      emotionalIq: 0.10,
    };

    const relationshipScore = Math.min(100, data.avgRelationshipHealth);
    const interactionScore = Math.min(100, (data.recentInteractions / 14) * 100);
    const journalScore = Math.min(100, (data.journalDaysThisWeek / 7) * 100);
    const gratitudeScore = data.gratitudeEntriesToday > 0 ? 100 : 0;
    const moodScore = (data.avgMoodWeek / 10) * 100;
    const eiqScore = data.emotionalIq ?? 50;

    return Math.round(
      weights.relationshipHealth * relationshipScore +
      weights.interactions * interactionScore +
      weights.journaling * journalScore +
      weights.gratitude * gratitudeScore +
      weights.mood * moodScore +
      weights.emotionalIq * eiqScore,
    );
  }

  computeHopeScore(data: {
    activeGoalsCount: number;
    avgGoalProgress: number;
    hasVisionBoard: boolean;
    purposeClarityScore?: number;
    lifeAlignmentScore?: number;
    motivationLevel: number;
  }): number {
    const goalScore = Math.min(100, (data.activeGoalsCount / 5) * 30 + data.avgGoalProgress * 0.7);
    const visionScore = data.hasVisionBoard ? 20 : 0;
    const purposeScore = data.purposeClarityScore ?? 50;
    const alignmentScore = data.lifeAlignmentScore ?? 50;
    const motivationScore = (data.motivationLevel / 10) * 100;

    return Math.round(
      0.25 * goalScore +
      0.20 * visionScore +
      0.25 * purposeScore +
      0.20 * alignmentScore +
      0.10 * motivationScore,
    );
  }

  computeHealthScore(data: {
    avgSleepHrs: number;
    sleepQuality: number;
    exerciseDaysPerWeek: number;
    avgStressLevel: number;
    meditationDaysPerWeek: number;
    habitsCompletionRate: number;
    waterGoalMet: boolean;
  }): number {
    const sleepScore = this.sleepScore(data.avgSleepHrs, data.sleepQuality);
    const exerciseScore = Math.min(100, (data.exerciseDaysPerWeek / 5) * 100);
    const stressScore = Math.max(0, 100 - (data.avgStressLevel / 10) * 100);
    const meditationScore = Math.min(100, (data.meditationDaysPerWeek / 7) * 100);
    const habitScore = data.habitsCompletionRate * 100;
    const hydrationScore = data.waterGoalMet ? 100 : 50;

    return Math.round(
      0.25 * sleepScore +
      0.20 * exerciseScore +
      0.20 * stressScore +
      0.15 * meditationScore +
      0.15 * habitScore +
      0.05 * hydrationScore,
    );
  }

  computeHelpScore(data: {
    volunteerHoursThisMonth: number;
    donationsThisMonth: number;
    activeMentees: number;
    communityPostsThisWeek: number;
    challengesActive: number;
  }): number {
    const volunteerScore = Math.min(100, (data.volunteerHoursThisMonth / 8) * 100);
    const donationScore = data.donationsThisMonth > 0 ? Math.min(100, (data.donationsThisMonth / 1000) * 100) : 0;
    const mentorScore = Math.min(100, data.activeMentees * 20);
    const communityScore = Math.min(100, data.communityPostsThisWeek * 20);
    const challengeScore = Math.min(100, data.challengesActive * 30);

    return Math.round(
      0.30 * volunteerScore +
      0.25 * donationScore +
      0.20 * mentorScore +
      0.15 * communityScore +
      0.10 * challengeScore,
    );
  }

  async computeAndStoreDailyScore(userId: string, date: Date): Promise<HappinessBreakdown> {
    const dateStr = date.toISOString().split('T')[0];

    const [
      relationships,
      habitLogs,
      journals,
      gratitude,
      healthLog,
      goals,
      impactProfile,
      communityPosts,
      challengeParticipations,
    ] = await Promise.all([
      this.prisma.relationship.findMany({ where: { userId } }),
      this.prisma.habitLog.findMany({ where: { userId, date: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      this.prisma.journalEntry.findMany({ where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      this.prisma.gratitudeEntry.findMany({ where: { userId, createdAt: { gte: new Date(date.getTime()) } } }),
      this.prisma.healthLog.findFirst({ where: { userId, date: new Date(dateStr) } }),
      this.prisma.goal.findMany({ where: { userId, status: 'active' } }),
      this.prisma.impactProfile.findUnique({ where: { userId } }),
      this.prisma.communityPost.findMany({ where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
      this.prisma.challengeParticipant.findMany({ where: { userId, completed: false } }),
    ]);

    const avgRelHealth = relationships.length > 0
      ? relationships.reduce((a, r) => a + (r.healthScore ?? 50), 0) / relationships.length
      : 50;

    const heartScore = this.computeHeartScore({
      relationshipCount: relationships.length,
      avgRelationshipHealth: avgRelHealth,
      recentInteractions: 5,
      journalDaysThisWeek: journals.length,
      gratitudeEntriesToday: gratitude.length,
      avgMoodWeek: healthLog?.stressLevel ? 10 - healthLog.stressLevel : 7,
    });

    const avgGoalProgress = goals.length > 0
      ? goals.reduce((a, g) => a + (g.progressPct ?? 0), 0) / goals.length
      : 0;

    const hopeScore = this.computeHopeScore({
      activeGoalsCount: goals.length,
      avgGoalProgress,
      hasVisionBoard: false,
      motivationLevel: 7,
    });

    const habitsTotal = habitLogs.length;
    const habitsCompleted = habitLogs.filter(h => h.count > 0).length;

    const healthScore = this.computeHealthScore({
      avgSleepHrs: healthLog?.sleepHrs?.toNumber() ?? 7,
      sleepQuality: healthLog?.sleepQuality ?? 7,
      exerciseDaysPerWeek: 3,
      avgStressLevel: healthLog?.stressLevel ?? 5,
      meditationDaysPerWeek: healthLog?.meditationMins ? 1 : 0,
      habitsCompletionRate: habitsTotal > 0 ? habitsCompleted / habitsTotal : 0.5,
      waterGoalMet: (healthLog?.waterMl ?? 0) >= 2000,
    });

    const helpScore = this.computeHelpScore({
      volunteerHoursThisMonth: 0,
      donationsThisMonth: 0,
      activeMentees: 0,
      communityPostsThisWeek: communityPosts.length,
      challengesActive: challengeParticipations.length,
    });

    const breakdown = this.computeHappiness({ heart: heartScore, hope: hopeScore, health: healthScore, help: helpScore });

    // Upsert daily score
    await this.prisma.dailyScore.upsert({
      where: { userId_date: { userId, date: new Date(dateStr) } },
      create: {
        userId,
        date: new Date(dateStr),
        heartScore: heartScore,
        hopeScore: hopeScore,
        healthScore: healthScore,
        helpScore: helpScore,
        happinessScore: breakdown.happiness,
        mood: healthLog?.stressLevel ? 11 - healthLog.stressLevel : 7,
        energy: 7,
        stress: healthLog?.stressLevel ?? 5,
        habitsCompleted,
        habitsTotal,
      },
      update: {
        heartScore: heartScore,
        hopeScore: hopeScore,
        healthScore: healthScore,
        helpScore: helpScore,
        happinessScore: breakdown.happiness,
      },
    });

    return breakdown;
  }

  async getTodayScore(userId: string) {
    const today = new Date(); today.setHours(0,0,0,0);
    return this.prisma.dailyScore.findFirst({ where: { userId, date: today } });
  }

  async getScoreHistory(userId: string, days = 30) {
    const from = new Date(); from.setDate(from.getDate() - days);
    return this.prisma.dailyScore.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'desc' },
    });
  }

  async getLatestWeeklyReport(userId: string) {
    return this.prisma.weeklyReport.findFirst({ where: { userId }, orderBy: { weekStart: 'desc' } });
  }

  async computeAndStoreDailyScore(userId: string, dto: { heartScore: number; hopeScore: number; healthScore: number; helpScore: number; mood?: number; energyLevel?: number; notes?: string; gratitudeItems?: string[] }) {
    const { heartScore, hopeScore, healthScore, helpScore, mood, energyLevel, notes, gratitudeItems } = dto;
    const breakdown = this.computeHappiness({ heart: heartScore, hope: hopeScore, health: healthScore, help: helpScore });
    const today = new Date(); today.setHours(0,0,0,0);

    const score = await this.prisma.dailyScore.upsert({
      where: { userId_date: { userId, date: today } },
      create: { userId, date: today, heartScore, hopeScore, healthScore, helpScore, totalScore: breakdown.happiness, mood, energyLevel, notes },
      update: { heartScore, hopeScore, healthScore, helpScore, totalScore: breakdown.happiness, mood, energyLevel, notes },
    });

    if (gratitudeItems?.length) {
      await this.prisma.gratitudeEntry.create({ data: { userId, items: gratitudeItems, mood } });
    }

    return { score, breakdown };
  }

  private sleepScore(hrs: number, quality: number): number {
    // Optimal: 7-9 hours
    let hrsScore = 0;
    if (hrs >= 7 && hrs <= 9) hrsScore = 100;
    else if (hrs >= 6 && hrs < 7) hrsScore = 70;
    else if (hrs > 9 && hrs <= 10) hrsScore = 80;
    else if (hrs < 6) hrsScore = Math.max(0, hrs / 6 * 50);
    else hrsScore = Math.max(0, 100 - (hrs - 10) * 20);

    return Math.round(0.6 * hrsScore + 0.4 * (quality / 10) * 100);
  }
}
