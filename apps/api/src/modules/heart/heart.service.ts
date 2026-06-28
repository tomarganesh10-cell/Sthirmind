import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto } from './dto/create-journal.dto';
import { CreateRelationshipDto } from './dto/create-relationship.dto';

@Injectable()
export class HeartService {
  constructor(private prisma: PrismaService) {}

  async getJournalEntries(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.journalEntry.count({ where: { userId } }),
    ]);
    return { items, total, page, limit };
  }

  async createJournalEntry(userId: string, dto: CreateJournalDto) {
    return this.prisma.journalEntry.create({
      data: { userId, ...dto },
    });
  }

  async getRelationships(userId: string) {
    return this.prisma.relationship.findMany({
      where: { userId },
      orderBy: { closeness: 'desc' },
      include: { _count: { select: { interactions: true } } },
    });
  }

  async createRelationship(userId: string, dto: CreateRelationshipDto) {
    return this.prisma.relationship.create({ data: { userId, ...dto } });
  }

  async logGratitude(userId: string, items: string[], mood?: number) {
    return this.prisma.gratitudeEntry.create({ data: { userId, items, mood } });
  }

  async getGratitudeHistory(userId: string, limit = 30) {
    return this.prisma.gratitudeEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
