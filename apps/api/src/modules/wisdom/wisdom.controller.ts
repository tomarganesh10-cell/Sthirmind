import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUser as CU } from '../../common/decorators/current-user.decorator';
import { WisdomService } from './wisdom.service';
import { WisdomAiService } from './wisdom-ai.service';
import { WisdomAudioService } from './wisdom-audio.service';
import { WisdomAnalyticsService } from './wisdom-analytics.service';
import { UsersService } from '../users/users.service';

@ApiTags('Wisdom Library')
@ApiBearerAuth()
@UseGuards(ClerkAuthGuard)
@Controller('wisdom')
export class WisdomController {
  constructor(
    private wisdom: WisdomService,
    private wisdomAi: WisdomAiService,
    private wisdomAudio: WisdomAudioService,
    private wisdomAnalytics: WisdomAnalyticsService,
    private users: UsersService,
  ) {}

  // ── Book Catalog ─────────────────────────────────────────────────────────

  @Get('books')
  @ApiOperation({ summary: 'Search & browse the wisdom library' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pillar', required: false })
  async searchBooks(
    @Query('q') q = '',
    @Query('page') page = '1',
    @Query('pillar') pillar?: string,
  ) {
    if (q) return this.wisdom.searchBooks(q, parseInt(page, 10), 20, pillar);
    return this.wisdom.getFeaturedBooks();
  }

  @Get('books/category/:cat')
  async getByCategory(@Param('cat') cat: string) {
    return this.wisdom.getBooksByCategory(cat);
  }

  @Get('books/:id')
  async getBook(@Param('id') id: string) {
    return this.wisdom.getBookById(id);
  }

  // ── AI Summaries ──────────────────────────────────────────────────────────

  @Post('books/:id/summarize')
  @ApiOperation({ summary: 'Generate AI book summary (1min/5min/15min)' })
  async generateSummary(
    @CurrentUser() cu: CU,
    @Param('id') bookId: string,
    @Body() body: { length: 'one_min' | 'five_min' | 'fifteen_min' },
  ) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdomAi.generateSummary(bookId, body.length, user.id);
  }

  @Get('books/:id/summaries')
  @ApiOperation({ summary: 'Get available summaries for a book' })
  async getSummaries(@Param('id') bookId: string) {
    return this.wisdom['prisma'].bookSummary.findMany({
      where: { bookId, isPublic: true },
      select: { id: true, length: true, generatedAt: true, keyLessons: true },
    });
  }

  // ── Audio ─────────────────────────────────────────────────────────────────

  @Post('summaries/:id/audio')
  @ApiOperation({ summary: 'Generate audio narration for a summary' })
  async generateAudio(
    @Param('id') summaryId: string,
    @Body() body: { voice: any; provider?: any; background?: string },
  ) {
    return this.wisdomAudio.generateAudio(summaryId, body.voice, body.provider ?? 'elevenlabs', body.background);
  }

  @Get('audio/voices')
  getVoices() { return this.wisdomAudio.getAvailableVoices(); }

  @Post('audio/:id/listen')
  @ApiOperation({ summary: 'Log a listening session' })
  async logListening(
    @CurrentUser() cu: CU,
    @Param('id') audioId: string,
    @Body() body: { durationSec: number; completed: boolean; speed?: number; lastPosition?: number },
  ) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdomAudio.logListeningSession(
      user.id, audioId, body.durationSec, body.completed, body.speed ?? 1, body.lastPosition ?? 0,
    );
  }

  // ── User Library ──────────────────────────────────────────────────────────

  @Get('library')
  async getLibrary(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.getUserLibrary(user.id);
  }

  @Post('library/:bookId')
  async addToLibrary(@CurrentUser() cu: CU, @Param('bookId') bookId: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.addToLibrary(user.id, bookId);
  }

  @Patch('library/:id')
  async updateLibrary(@CurrentUser() cu: CU, @Param('id') id: string, @Body() body: any) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.updateLibraryEntry(user.id, id, body);
  }

  // ── Knowledge Vault ───────────────────────────────────────────────────────

  @Get('notes')
  @ApiQuery({ name: 'bookId', required: false })
  @ApiQuery({ name: 'type', required: false })
  async getNotes(@CurrentUser() cu: CU, @Query('bookId') bookId?: string, @Query('type') type?: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.getNotes(user.id, bookId, type);
  }

  @Post('notes')
  async createNote(@CurrentUser() cu: CU, @Body() body: any) {
    const user = await this.users.findByClerkId(cu.id);
    const note = await this.wisdom.createNote(user.id, body);
    // Async knowledge extraction
    this.wisdomAi.extractKnowledgeFromNote(user.id, note.id).catch(() => {});
    return note;
  }

  @Patch('notes/:id/star')
  async toggleStar(@CurrentUser() cu: CU, @Param('id') id: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.toggleStarNote(user.id, id);
  }

  // ── Knowledge Graph ───────────────────────────────────────────────────────

  @Get('knowledge-graph')
  async getKnowledgeGraph(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.getKnowledgeGraph(user.id);
  }

  @Post('knowledge-graph/build')
  async buildGraph(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.buildKnowledgeGraph(user.id);
  }

  // ── Daily Wisdom ──────────────────────────────────────────────────────────

  @Get('daily')
  async getDailyWisdom(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    let wisdom = await this.wisdom.getDailyWisdom(user.id);
    if (!wisdom) {
      const generated = await this.wisdomAi.generateDailyWisdom(user.id);
      if (generated.quote) {
        wisdom = await this.wisdom['prisma'].dailyWisdom.create({
          data: {
            userId: user.id,
            date: new Date(),
            quote: generated.quote,
            quoteAuthor: generated.quoteAuthor,
            insight: generated.insight,
            reflectionQuestion: generated.reflectionQuestion,
            pillarFocus: generated.pillarFocus?.toUpperCase(),
          },
        });
      }
    }
    return wisdom;
  }

  @Post('daily/:id/open')
  async openWisdom(@CurrentUser() cu: CU, @Param('id') id: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.markWisdomOpened(user.id, id);
  }

  // ── Book Chat ─────────────────────────────────────────────────────────────

  @Get('books/:id/chat')
  async getChatSessions(@CurrentUser() cu: CU, @Param('id') bookId: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.getBookChatSessions(user.id, bookId);
  }

  @Post('books/:id/chat')
  async startChat(@CurrentUser() cu: CU, @Param('id') bookId: string, @Body() body: { title?: string }) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.createChatSession(user.id, bookId, body.title);
  }

  @Post('chat/:sessionId/message')
  async sendChatMessage(
    @CurrentUser() cu: CU,
    @Param('sessionId') sessionId: string,
    @Body() body: { message: string },
  ) {
    const user = await this.users.findByClerkId(cu.id);
    const history = await this.wisdom.getChatMessages(sessionId);
    const session = await this.wisdom['prisma'].bookChatSession.findUnique({ where: { id: sessionId } });
    return this.wisdomAi.chatWithBook(session!.bookId, sessionId, user.id, body.message, history);
  }

  @Get('chat/:sessionId/messages')
  async getChatMessages(@Param('sessionId') sessionId: string) {
    return this.wisdom.getChatMessages(sessionId);
  }

  // ── Analytics ─────────────────────────────────────────────────────────────

  @Get('analytics')
  async getAnalytics(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    const [history, stats, scores] = await Promise.all([
      this.wisdom.getWisdomAnalytics(user.id),
      this.wisdom.getWisdomStats(user.id),
      this.wisdomAnalytics.computeWisdomScore(user.id),
    ]);
    return { history, stats, scores };
  }

  @Post('analytics/sync')
  async syncAnalytics(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdomAnalytics.updateDailyAnalytics(user.id);
  }

  // ── Recommendations ───────────────────────────────────────────────────────

  @Get('recommendations')
  async getRecommendations(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.getRecommendations(user.id);
  }

  @Post('recommendations/generate')
  async generateRecommendations(@CurrentUser() cu: CU) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdomAi.generateRecommendations(user.id);
  }

  @Delete('recommendations/:id')
  async dismissRecommendation(@CurrentUser() cu: CU, @Param('id') id: string) {
    const user = await this.users.findByClerkId(cu.id);
    return this.wisdom.dismissRecommendation(user.id, id);
  }
}
