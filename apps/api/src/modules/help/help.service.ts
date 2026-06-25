import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HelpService {
  constructor(private prisma: PrismaService) {}

  async getImpactProfile(userId: string) {
    return this.prisma.impactProfile.findUnique({ where: { userId } });
  }

  async logVolunteer(userId: string, data: any) {
    const activity = await this.prisma.volunteerActivity.create({ data: { userId, ...data } });
    await this.prisma.impactProfile.upsert({
      where: { userId },
      create: { userId, totalHours: data.hours },
      update: { totalHours: { increment: data.hours } },
    });
    return activity;
  }

  async getVolunteerHistory(userId: string) {
    return this.prisma.volunteerActivity.findMany({ where: { userId }, orderBy: { date: 'desc' } });
  }

  async getChallenges() {
    return this.prisma.challenge.findMany({
      where: { endDate: { gte: new Date() } },
      include: { _count: { select: { participants: true } } },
    });
  }

  async joinChallenge(userId: string, challengeId: string) {
    return this.prisma.challengeParticipant.upsert({
      where: { challengeId_userId: { challengeId, userId } },
      create: { challengeId, userId },
      update: {},
    });
  }
}
