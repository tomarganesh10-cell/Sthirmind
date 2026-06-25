import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WisdomAiService {
  private readonly logger = new Logger(WisdomAiService.name);
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  constructor(private prisma: PrismaService) {}

  // ── Core Summary Generation ───────────────────────────────────────────────

  async generateSummary(bookId: string, length: 'one_min' | 'five_min' | 'fifteen_min', userId?: string) {
    const book = await this.prisma.wisdomBook.findUnique({ where: { id: bookId } });
    if (!book) throw new Error('Book not found');

    // Check cache
    const cached = await this.prisma.bookSummary.findFirst({
      where: { bookId, userId: userId ?? null, length: length.toUpperCase() as any },
    });
    if (cached) return cached;

    const wordCount = { one_min: 200, five_min: 900, fifteen_min: 2800 }[length];
    const prompt = this.buildSummaryPrompt(book.title, book.author, book.description ?? '', length, wordCount);

    this.logger.log(`Generating ${length} summary for "${book.title}"`);
    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: length === 'fifteen_min' ? 4096 : length === 'five_min' ? 2048 : 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '';
    const parsed = this.parseSummaryResponse(raw);

    const summary = await this.prisma.bookSummary.create({
      data: {
        bookId,
        userId: userId ?? null,
        length: length.toUpperCase() as any,
        content: parsed.content,
        keyLessons: parsed.keyLessons,
        actionItems: parsed.actionItems,
        quotes: parsed.quotes,
        mentalModels: parsed.mentalModels,
        lifeApps: parsed.lifeApps,
        founderApps: parsed.founderApps,
        leadershipApps: parsed.leadershipApps,
        healthApps: parsed.healthApps,
        happinessBoost: parsed.happinessBoost,
        modelUsed: 'claude-sonnet-4-6',
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        isPublic: !userId,
      },
    });

    return summary;
  }

  private buildSummaryPrompt(title: string, author: string, description: string, length: string, wordCount: number): string {
    return `You are the SthirMind Wisdom Engine — the world's most insightful book summary AI.

Summarize: "${title}" by ${author}
${description ? `Description: ${description}` : ''}

Generate a ${wordCount}-word comprehensive wisdom extraction in this EXACT JSON format:

{
  "content": "The ${length.replace('_', ' ')} summary narrative (${wordCount} words, engaging, story-like, first principles)...",
  "keyLessons": [
    {"lesson": "...", "pillar": "heart|hope|health|help", "example": "...", "depth": "..."},
    ...minimum 7 lessons for 15min, 5 for 5min, 3 for 1min
  ],
  "actionItems": [
    "Specific actionable step 1 you can take today",
    "Specific actionable step 2",
    ...minimum 5 items
  ],
  "quotes": [
    {"text": "Most powerful direct quote from book", "context": "Why this matters"},
    ...3-7 quotes
  ],
  "mentalModels": [
    {"name": "Mental Model Name", "description": "What it is", "example": "Real-world application", "origin": "From this book"},
    ...3-5 models
  ],
  "lifeApps": {
    "heart": "How this book improves relationships and love",
    "hope": "How this book helps with goals and purpose",
    "health": "How this book impacts physical and mental health",
    "help": "How this book supports giving and contribution"
  },
  "founderApps": [
    "Business lesson 1 extracted for founders/entrepreneurs",
    "Marketing insight for startups",
    "Leadership principle for CEOs"
  ],
  "leadershipApps": [
    "Leadership lesson 1",
    "Team management insight",
    "Decision-making framework"
  ],
  "healthApps": [
    "Physical health application",
    "Mental health application",
    "Habit formation insight"
  ],
  "happinessBoost": {
    "heart": 0-10,
    "hope": 0-10,
    "health": 0-10,
    "help": 0-10,
    "explanation": "Why this book specifically improves these pillars"
  }
}

Be extraordinarily specific, actionable, and profound. Reference specific chapters, frameworks, and examples from the book. Make every word earn its place.`;
  }

  private parseSummaryResponse(raw: string): any {
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      this.logger.warn('Failed to parse summary JSON, using raw');
    }
    return {
      content: raw,
      keyLessons: [], actionItems: [], quotes: [],
      mentalModels: [], lifeApps: {}, founderApps: [],
      leadershipApps: [], healthApps: [], happinessBoost: {},
    };
  }

  // ── Book Chat ─────────────────────────────────────────────────────────────

  async chatWithBook(
    bookId: string, sessionId: string, userId: string, userMessage: string, history: Array<{role: string; content: string}>
  ) {
    const book = await this.prisma.wisdomBook.findUnique({ where: { id: bookId } });
    const summary = await this.prisma.bookSummary.findFirst({
      where: { bookId, length: 'FIFTEEN_MIN' as any },
    });

    const systemPrompt = `You are an AI embodiment of "${book?.title}" by ${book?.author}.

You have deep knowledge of this book's content, philosophy, frameworks, and wisdom.
You speak AS the book — bringing its insights to life in conversation.

${summary ? `BOOK WISDOM CONTEXT:\n${summary.content}\n\nKEY LESSONS:\n${JSON.stringify(summary.keyLessons).slice(0, 2000)}` : ''}

Rules:
- Answer questions AS IF you ARE this book's intelligence
- Reference specific chapters, frameworks, and examples when relevant
- Connect insights to the user's question concretely
- Give actionable, specific responses (not vague platitudes)
- Always end with one powerful question that makes the user think deeper
- Keep responses conversational but profound (150-300 words)
- When asked for implementation steps, provide numbered, specific steps
- Connect to the 5H framework (Heart/Hope/Health/Help) when relevant`;

    const messages = [
      ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
      { role: 'user' as const, content: userMessage },
    ];

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    // Save messages
    await this.prisma.$transaction([
      this.prisma.bookChatMessage.create({ data: { sessionId, role: 'user', content: userMessage } }),
      this.prisma.bookChatMessage.create({ data: { sessionId, role: 'assistant', content: reply } }),
      this.prisma.bookChatSession.update({ where: { id: sessionId }, data: { messageCount: { increment: 2 }, updatedAt: new Date() } }),
    ]);

    return { message: reply, tokensUsed: response.usage.input_tokens + response.usage.output_tokens };
  }

  // ── Daily Wisdom Generation ───────────────────────────────────────────────

  async generateDailyWisdom(userId: string) {
    // Get user context
    const [latestScore, recentBooks, goals] = await Promise.all([
      this.prisma.dailyScore.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      this.prisma.userBook.findMany({
        where: { userId, status: { in: ['COMPLETED', 'READING'] } },
        include: { book: true },
        take: 5,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE' }, take: 3 }),
    ]);

    const context = {
      happinessScore: latestScore?.totalScore ?? 60,
      weakestPillar: this.getWeakestPillar(latestScore),
      recentBooks: recentBooks.map(b => b.book?.title ?? b.customTitle).filter(Boolean),
      activeGoals: goals.map(g => g.title),
    };

    const prompt = `Generate a personalized daily wisdom package for a SthirMind user.

USER CONTEXT:
- Happiness Score: ${context.happinessScore}/100
- Needs most work on: ${context.weakestPillar} pillar
- Recently reading: ${context.recentBooks.join(', ') || 'various books'}
- Active goals: ${context.activeGoals.join(', ') || 'growing personally'}

Generate JSON:
{
  "quote": "A powerful, relevant quote (can be from a book or famous person)",
  "quoteAuthor": "Author/Source",
  "insight": "A 2-3 sentence actionable insight for today based on their context",
  "reflectionQuestion": "One profound question for morning reflection",
  "pillarFocus": "heart|hope|health|help",
  "bookSuggestion": "A specific book recommendation with one sentence why"
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  }

  // ── Knowledge Extraction ──────────────────────────────────────────────────

  async extractKnowledgeFromNote(userId: string, noteId: string) {
    const note = await this.prisma.knowledgeNote.findUnique({
      where: { id: noteId },
      include: { book: { select: { title: true, author: true } } },
    });
    if (!note) throw new Error('Note not found');

    const prompt = `Analyze this book note and extract structured knowledge for a personal knowledge graph.

Book: ${note.book?.title ?? 'Unknown'} by ${note.book?.author ?? 'Unknown'}
Note: "${note.content}"

Return JSON:
{
  "concepts": ["key concept 1", "key concept 2"],
  "connections": ["connects to goal setting", "connects to health"],
  "pillarTags": ["heart", "hope", "health", "help"],
  "mentalModel": "Name of mental model if applicable",
  "actionable": true/false,
  "importanceScore": 0-10,
  "tags": ["tag1", "tag2"]
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : {};
    } catch {
      return {};
    }
  }

  // ── Recommendation Engine ─────────────────────────────────────────────────

  async generateRecommendations(userId: string) {
    const [userBooks, latestScore, goals, notes] = await Promise.all([
      this.prisma.userBook.findMany({ where: { userId }, include: { book: true } }),
      this.prisma.dailyScore.findFirst({ where: { userId }, orderBy: { date: 'desc' } }),
      this.prisma.goal.findMany({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.knowledgeNote.findMany({ where: { userId }, take: 20 }),
    ]);

    const readBookIds = userBooks.map(b => b.bookId).filter(Boolean) as string[];
    const allBooks = await this.prisma.wisdomBook.findMany({
      where: { id: { notIn: readBookIds }, isPublic: true },
      take: 50,
    });

    if (!allBooks.length) return [];

    const context = {
      weakestPillar: this.getWeakestPillar(latestScore),
      activeGoals: goals.map(g => `${g.title} (${g.pillar})`),
      recentTags: notes.flatMap(n => n.tags).slice(0, 10),
      readBooks: userBooks.map(b => b.book?.title ?? b.customTitle).slice(0, 5),
    };

    const prompt = `Given a user's profile, recommend 5 books from this catalog.

USER PROFILE:
- Weakest pillar: ${context.weakestPillar}
- Active goals: ${context.activeGoals.join(', ')}
- Interest tags: ${context.recentTags.join(', ')}
- Already read: ${context.readBooks.join(', ')}

AVAILABLE BOOKS:
${allBooks.slice(0, 20).map(b => `- ID:${b.id} | "${b.title}" by ${b.author} | Tags: ${b.tags.join(',')}`).join('\n')}

Return JSON array:
[{"bookId": "uuid", "score": 0-10, "reasons": ["reason1", "reason2"], "pillarMatch": {"heart": 0-10, "hope": 0-10, "health": 0-10, "help": 0-10}}]`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const raw = response.content[0].type === 'text' ? response.content[0].text : '[]';
      const match = raw.match(/\[[\s\S]*\]/);
      const recs = match ? JSON.parse(match[0]) : [];

      // Save recommendations
      for (const rec of recs.slice(0, 5)) {
        if (!rec.bookId) continue;
        await this.prisma.wisdomRecommendation.upsert({
          where: { userId_bookId: { userId, bookId: rec.bookId } } as any,
          create: { userId, bookId: rec.bookId, score: rec.score, reasons: rec.reasons, pillarMatch: rec.pillarMatch },
          update: { score: rec.score, reasons: rec.reasons },
        }).catch(() => {}); // ignore if already exists
      }

      return recs;
    } catch (e) {
      this.logger.error('Recommendation generation failed', e);
      return [];
    }
  }

  private getWeakestPillar(score: any): string {
    if (!score) return 'hope';
    const pillars = { heart: score.heartScore ?? 50, hope: score.hopeScore ?? 50, health: score.healthScore ?? 50, help: score.helpScore ?? 50 };
    return Object.entries(pillars).sort(([,a],[,b]) => a - b)[0][0];
  }
}
