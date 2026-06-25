import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WisdomService {
  constructor(private prisma: PrismaService) {}

  // ── Book Catalog ──────────────────────────────────────────────────────────

  async searchBooks(query: string, page = 1, limit = 20, pillar?: string) {
    const skip = (page - 1) * limit;
    const where: any = {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { author: { contains: query, mode: 'insensitive' } },
        { tags: { has: query.toLowerCase() } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };
    if (pillar) where.pillarTags = { has: pillar };

    const [items, total] = await Promise.all([
      this.prisma.wisdomBook.findMany({ where, skip, take: limit, orderBy: { wisdomScore: 'desc' } }),
      this.prisma.wisdomBook.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  async getFeaturedBooks(limit = 12) {
    return this.prisma.wisdomBook.findMany({
      where: { isPublic: true },
      orderBy: { wisdomScore: 'desc' },
      take: limit,
    });
  }

  async getBookById(id: string) {
    const book = await this.prisma.wisdomBook.findUnique({
      where: { id },
      include: {
        summaries: { where: { userId: null, isPublic: true }, select: { id: true, length: true, generatedAt: true } },
      },
    });
    if (!book) throw new NotFoundException('Book not found');
    await this.prisma.wisdomBook.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return book;
  }

  async getBooksByCategory(category: string, limit = 20) {
    return this.prisma.wisdomBook.findMany({
      where: { OR: [{ category }, { tags: { has: category } }] },
      orderBy: { wisdomScore: 'desc' },
      take: limit,
    });
  }

  // ── User Library ─────────────────────────────────────────────────────────

  async getUserLibrary(userId: string) {
    return this.prisma.userBook.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true, category: true } },
      },
    });
  }

  async addToLibrary(userId: string, bookId: string) {
    return this.prisma.userBook.upsert({
      where: { userId_bookId: { userId, bookId } },
      create: { userId, bookId, status: 'WANT_TO_READ' },
      update: {},
    });
  }

  async updateLibraryEntry(userId: string, userBookId: string, data: Partial<{
    status: string; progress: number; currentPage: number; rating: number; personalNote: string;
  }>) {
    const entry = await this.prisma.userBook.findFirst({ where: { id: userBookId, userId } });
    if (!entry) throw new NotFoundException('Not in your library');
    const updates: any = { ...data };
    if (data.status === 'READING' && !entry.startedAt) updates.startedAt = new Date();
    if (data.status === 'COMPLETED' && !entry.completedAt) updates.completedAt = new Date();
    return this.prisma.userBook.update({ where: { id: userBookId }, data: updates });
  }

  async uploadBook(userId: string, data: { title: string; author: string; fileUrl: string; fileSizeMb: number }) {
    return this.prisma.userBook.create({
      data: { userId, customTitle: data.title, customAuthor: data.author, fileUrl: data.fileUrl, fileSizeMb: data.fileSizeMb, status: 'WANT_TO_READ' },
    });
  }

  // ── Knowledge Notes ──────────────────────────────────────────────────────

  async getNotes(userId: string, bookId?: string, type?: string) {
    const where: any = { userId };
    if (bookId) where.bookId = bookId;
    if (type) where.type = type;
    return this.prisma.knowledgeNote.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { book: { select: { title: true, author: true } } },
    });
  }

  async createNote(userId: string, data: {
    bookId?: string; userBookId?: string; type: string;
    content: string; pageRef?: number; chapterRef?: string;
    pillarTags?: string[]; tags?: string[]; lessonCategory?: string;
  }) {
    return this.prisma.knowledgeNote.create({ data: { userId, ...data } });
  }

  async toggleStarNote(userId: string, noteId: string) {
    const note = await this.prisma.knowledgeNote.findFirst({ where: { id: noteId, userId } });
    if (!note) throw new NotFoundException();
    return this.prisma.knowledgeNote.update({ where: { id: noteId }, data: { isStarred: !note.isStarred } });
  }

  // ── Knowledge Graph ──────────────────────────────────────────────────────

  async getKnowledgeGraph(userId: string) {
    const [nodes, edges] = await Promise.all([
      this.prisma.knowledgeNode.findMany({ where: { userId }, orderBy: { weight: 'desc' }, take: 100 }),
      this.prisma.knowledgeEdge.findMany({ where: { userId }, take: 200 }),
    ]);
    return { nodes, edges };
  }

  async buildKnowledgeGraph(userId: string) {
    // Collect all user books, notes, goals, habits as nodes
    const [userBooks, notes, goals, habits] = await Promise.all([
      this.prisma.userBook.findMany({ where: { userId, status: 'COMPLETED' }, include: { book: true } }),
      this.prisma.knowledgeNote.findMany({ where: { userId, isStarred: true } }),
      this.prisma.goal.findMany({ where: { userId } }),
      this.prisma.habit.findMany({ where: { userId } }),
    ]);

    // Create book nodes
    for (const ub of userBooks) {
      if (!ub.book) continue;
      await this.prisma.knowledgeNode.upsert({
        where: { userId_type_sourceId: { userId, type: 'book', sourceId: ub.bookId! } } as any,
        create: { userId, type: 'book', title: ub.book.title, description: ub.book.author, sourceId: ub.bookId!, sourceType: 'wisdom_book' },
        update: { title: ub.book.title },
      });
    }

    return this.getKnowledgeGraph(userId);
  }

  // ── Daily Wisdom ─────────────────────────────────────────────────────────

  async getDailyWisdom(userId: string) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return this.prisma.dailyWisdom.findFirst({ where: { userId, date: today } });
  }

  async markWisdomOpened(userId: string, wisdomId: string) {
    return this.prisma.dailyWisdom.update({ where: { id: wisdomId }, data: { openedAt: new Date() } });
  }

  // ── Book Chat ─────────────────────────────────────────────────────────────

  async getBookChatSessions(userId: string, bookId: string) {
    return this.prisma.bookChatSession.findMany({
      where: { userId, bookId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getChatMessages(sessionId: string) {
    return this.prisma.bookChatMessage.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } });
  }

  async createChatSession(userId: string, bookId: string, title?: string) {
    return this.prisma.bookChatSession.create({ data: { userId, bookId, title } });
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  async getWisdomAnalytics(userId: string, days = 30) {
    const from = new Date(); from.setDate(from.getDate() - days);
    return this.prisma.wisdomAnalytic.findMany({
      where: { userId, date: { gte: from } },
      orderBy: { date: 'asc' },
    });
  }

  async getWisdomStats(userId: string) {
    const [library, notes, sessions, analytics] = await Promise.all([
      this.prisma.userBook.aggregate({ where: { userId }, _count: { _all: true }, _avg: { progress: true } }),
      this.prisma.knowledgeNote.count({ where: { userId } }),
      this.prisma.listeningSession.aggregate({ where: { userId }, _sum: { durationSec: true }, _count: { _all: true } }),
      this.prisma.wisdomAnalytic.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
    ]);
    return {
      booksInLibrary: library._count._all,
      avgProgress: library._avg.progress,
      notesCreated: notes,
      totalListeningMin: Math.round((sessions._sum.durationSec ?? 0) / 60),
      sessionsCompleted: sessions._count._all,
      latestScores: analytics,
    };
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  async getRecommendations(userId: string) {
    const recs = await this.prisma.wisdomRecommendation.findMany({
      where: { userId, isDismissed: false },
      orderBy: { score: 'desc' },
      take: 10,
      include: { book: true },
    });
    if (recs.length > 0) return recs;

    // Fallback: return top books not in user library
    const userBookIds = (await this.prisma.userBook.findMany({ where: { userId }, select: { bookId: true } }))
      .map(b => b.bookId).filter(Boolean);

    return this.prisma.wisdomBook.findMany({
      where: { id: { notIn: userBookIds as string[] }, isPublic: true },
      orderBy: { wisdomScore: 'desc' },
      take: 10,
    });
  }

  async dismissRecommendation(userId: string, recId: string) {
    return this.prisma.wisdomRecommendation.update({ where: { id: recId }, data: { isDismissed: true } });
  }
}
