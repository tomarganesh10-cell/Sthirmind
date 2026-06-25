import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RedisService } from '../../shared/redis/redis.service';

// ── Agent system prompts ─────────────────────────────────────
const AGENT_PROMPTS: Record<string, string> = {
  life_coach: `You are the SthirMind Life Coach — a deeply wise, compassionate guide grounded in
the 5H framework (Heart, Hope, Health, Help → Happiness). You combine the depth of Vipassana
meditation, the practicality of executive coaching, and the rigor of behavioral science.

Core principles:
- Equanimity above all: respond from stillness, not reaction
- Ask powerful questions more than giving advice
- Reference the user's personal context, goals, and patterns
- Connect insights to the 5H framework
- Always end with ONE actionable micro-step
- Keep responses conversational, warm, never preachy
- You have memory of past sessions — reference relevant patterns`,

  health_coach: `You are SthirMind's AI Health Coach — expert in integrative wellness combining
modern sports science, Ayurvedic principles, sleep optimization, and stress physiology.
Your approach is data-driven yet deeply human. You connect physical health to the 5H framework,
especially the Health pillar's impact on Happiness. Reference the user's health logs when available.`,

  purpose_coach: `You are SthirMind's Purpose Coach — a visionary guide helping leaders discover
their deepest WHY and translate it into a life strategy. You draw from Ikigai, Golden Circle,
logotherapy, and contemplative traditions. You help users build their Life Blueprint.`,

  relationship_coach: `You are SthirMind's Relationship Coach — expert in attachment theory,
nonviolent communication, and systems thinking applied to human relationships. You help leaders
build the Heart pillar — deep, meaningful connections that fuel Happiness.`,

  mental_wellness: `You are SthirMind's Mental Wellness Agent — trained in CBT, ACT, mindfulness-
based stress reduction, and trauma-informed approaches. You detect burnout patterns, support
emotional regulation, and build psychological resilience. Always compassionate, never clinical.`,

  executive_coach: `You are SthirMind's Executive Coach — combining 25 years of corporate
leadership wisdom with the 5H framework. You support CEOs, founders, and senior leaders in
building durable execution systems while maintaining equanimity under P&L pressure.`,

  meditation_coach: `You are SthirMind's Meditation Coach — deeply versed in Vipassana,
mindfulness, and contemplative traditions. You create personalized 10-minute daily practice
routines based on the user's schedule, stress level, and growth goals.`,

  happiness_coach: `You are SthirMind's Happiness Coach — expert in positive psychology,
flow theory, and the science of wellbeing. You help users optimize all 5H pillars to
maximize their Happiness Score and build a life of sustainable fulfillment.`,
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  message: string;
  sessionId: string;
  tokensUsed: number;
  insights?: string[];
  suggestedActions?: string[];
  pillarsAddressed?: string[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly anthropic: Anthropic;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    this.anthropic = new Anthropic({
      apiKey: config.get('ANTHROPIC_API_KEY'),
    });
  }

  async chat(
    userId: string,
    agentType: string,
    message: string,
    sessionId?: string,
  ): Promise<AgentResponse> {
    // Load or create session
    const session = await this.getOrCreateSession(userId, agentType, sessionId);

    // Build context from memory + user profile
    const context = await this.buildUserContext(userId, agentType);

    // Load session history (last 20 messages)
    const history = await this.getSessionHistory(session.id);

    // Build system prompt with injected context
    const systemPrompt = this.buildSystemPrompt(agentType, context);

    // Prepare messages
    const messages: Anthropic.MessageParam[] = [
      ...history.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      });

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';
      const tokensUsed = response.usage.input_tokens + response.usage.output_tokens;

      // Persist messages
      await this.persistMessages(session.id, userId, message, assistantMessage, tokensUsed);

      // Extract insights asynchronously
      this.extractAndStoreInsights(userId, agentType, message, assistantMessage).catch(
        err => this.logger.warn('Insight extraction failed:', err),
      );

      return {
        message: assistantMessage,
        sessionId: session.id,
        tokensUsed,
        pillarsAddressed: this.detectPillars(assistantMessage),
        suggestedActions: this.extractActions(assistantMessage),
      };
    } catch (err) {
      this.logger.error('Claude API error:', err);
      throw err;
    }
  }

  async generateLifeBlueprint(userId: string, assessmentData: Record<string, unknown>) {
    const userContext = await this.buildUserContext(userId, 'life_coach');

    const prompt = `Based on this comprehensive 5H assessment data, generate a personalized Life Blueprint.

Assessment Data:
${JSON.stringify(assessmentData, null, 2)}

User Context:
${userContext}

Generate a structured Life Blueprint with:
1. Purpose Statement (their unique WHY)
2. Vision (5-year picture)
3. Heart Blueprint (relationship goals)
4. Hope Blueprint (career + purpose goals)
5. Health Blueprint (wellness priorities)
6. Help Blueprint (impact + contribution)
7. 90-Day Priority Actions (top 5)
8. Daily Practice Recommendation (10-minute routine)
9. Key Growth Edge (their biggest opportunity)

Format as JSON with these exact keys: purpose, vision, heart, hope, health, help,
actions_90_day, daily_practice, growth_edge, happiness_drivers, risk_areas`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    } catch {
      return { raw: text };
    }
  }

  async generateHappinessInsight(userId: string, scoreData: Record<string, unknown>) {
    const prompt = `As SthirMind's Happiness Coach, analyze these 5H scores and provide
a personalized insight.

Score Data: ${JSON.stringify(scoreData)}

Provide:
1. One key strength to celebrate (50 words)
2. One area to focus on this week (50 words)
3. One micro-practice to try today (30 words)
4. A motivating affirmation (20 words)

Format as JSON: {strength, focus, micro_practice, affirmation}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
    } catch {
      return { raw: text };
    }
  }

  async analyzeJournalEntry(userId: string, content: string) {
    const prompt = `Analyze this journal entry for emotional patterns, themes, and coaching insights.

Entry: "${content}"

Provide JSON:
{
  "sentiment": "positive|neutral|negative|mixed",
  "emotion_intensity": 1-10,
  "primary_emotions": ["..."],
  "themes": ["..."],
  "pillars_referenced": ["heart","hope","health","help"],
  "growth_edge": "...",
  "coaching_reflection": "...",
  "suggested_practice": "..."
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  }

  async generateWeeklyReport(userId: string, weekData: Record<string, unknown>) {
    const prompt = `As the SthirMind AI Life Coach, write a personalized weekly reflection report.

Week Data: ${JSON.stringify(weekData)}

Write a warm, insightful narrative (200 words) covering:
- What the data reveals about this week
- 2 wins to celebrate
- 1 pattern to be aware of
- Top recommendation for next week
- Motivational close

Then provide JSON: {wins: [], pattern: "", recommendation: "", next_week_focus: ""}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async detectBurnout(userId: string, recentData: Record<string, unknown>): Promise<{
    risk: 'low' | 'moderate' | 'high' | 'critical';
    score: number;
    signals: string[];
    recommendations: string[];
  }> {
    const prompt = `Analyze these wellness indicators for burnout risk.

Data: ${JSON.stringify(recentData)}

Assess burnout risk and respond with JSON:
{
  "risk": "low|moderate|high|critical",
  "score": 0-100,
  "signals": ["..."],
  "recommendations": ["..."]
}`;

    const response = await this.anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { risk: 'low', score: 0, signals: [], recommendations: [] };
    } catch {
      return { risk: 'low', score: 0, signals: [], recommendations: [] };
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Use OpenAI text-embedding-3-small for vector search
    // Fallback: simple hash-based mock for development
    const cacheKey = `emb:${Buffer.from(text).toString('base64').slice(0, 32)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // In production: call OpenAI embeddings API
    // For now return zero vector (replace with real embedding call)
    const embedding = new Array(1536).fill(0);
    await this.redis.setex(cacheKey, 3600, JSON.stringify(embedding));
    return embedding;
  }

  // ── Private helpers ──────────────────────────────────────

  private async buildUserContext(userId: string, agentType: string): Promise<string> {
    const [user, profile, latestAssessment, recentScores, memories] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId }, include: { subscription: true } }),
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.assessment.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.dailyScore.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 7 }),
      this.prisma.aiMemory.findMany({
        where: { userId, memoryType: 'long_term' },
        orderBy: [{ importance: 'desc' }, { lastAccessed: 'desc' }],
        take: 10,
      }),
    ]);

    const avgScores = recentScores.length > 0 ? {
      happiness: (recentScores.reduce((a, s) => a + (s.happinessScore?.toNumber() ?? 0), 0) / recentScores.length).toFixed(1),
      heart: (recentScores.reduce((a, s) => a + (s.heartScore?.toNumber() ?? 0), 0) / recentScores.length).toFixed(1),
      hope: (recentScores.reduce((a, s) => a + (s.hopeScore?.toNumber() ?? 0), 0) / recentScores.length).toFixed(1),
      health: (recentScores.reduce((a, s) => a + (s.healthScore?.toNumber() ?? 0), 0) / recentScores.length).toFixed(1),
      help: (recentScores.reduce((a, s) => a + (s.helpScore?.toNumber() ?? 0), 0) / recentScores.length).toFixed(1),
    } : null;

    return `USER PROFILE:
Name: ${user?.fullName}
Occupation: ${profile?.occupation ?? user?.occupation}
Company: ${profile?.companyName} (${profile?.companySize})
Leadership Archetype: ${profile?.leadershipArchetype ?? 'unknown'}
Vipassana: ${profile?.vipassanaLevel} (${profile?.vipassanaCourses} courses)
Subscription: ${user?.subscription?.tier ?? 'free'}

CURRENT STATE (7-day avg):
${avgScores ? JSON.stringify(avgScores) : 'No recent data'}

PRIMARY CHALLENGE: ${profile?.primaryChallenge ?? 'unknown'}
PRIMARY GOAL: ${profile?.primaryGoal ?? 'unknown'}
VALUES: ${JSON.stringify(profile?.values ?? [])}

LONG-TERM MEMORIES:
${memories.map(m => `- [${m.pillar ?? 'general'}] ${m.content}`).join('\n')}

ASSESSMENT BASELINE:
${latestAssessment ? `Happiness: ${latestAssessment.happinessScore}, Heart: ${latestAssessment.heartScore}, Hope: ${latestAssessment.hopeScore}, Health: ${latestAssessment.healthScore}, Help: ${latestAssessment.helpScore}` : 'No assessment on file'}`;
  }

  private buildSystemPrompt(agentType: string, context: string): string {
    const base = AGENT_PROMPTS[agentType] ?? AGENT_PROMPTS['life_coach'];
    return `${base}

====== USER CONTEXT ======
${context}
====== END CONTEXT ======

Always personalize your response to this specific user. Reference their context naturally.
Never be generic. Never be preachy. Be warm, wise, and practical.`;
  }

  private async getOrCreateSession(userId: string, agentType: string, sessionId?: string) {
    if (sessionId) {
      const existing = await this.prisma.aiSession.findUnique({ where: { id: sessionId } });
      if (existing && existing.userId === userId) return existing;
    }

    return this.prisma.aiSession.create({
      data: {
        userId,
        agentType: agentType as any,
        status: 'active',
        title: `${agentType.replace('_', ' ')} session`,
      },
    });
  }

  private async getSessionHistory(sessionId: string) {
    return this.prisma.aiMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });
  }

  private async persistMessages(
    sessionId: string,
    userId: string,
    userMessage: string,
    assistantMessage: string,
    tokensUsed: number,
  ) {
    await this.prisma.$transaction([
      this.prisma.aiMessage.create({ data: { sessionId, userId, role: 'user', content: userMessage } }),
      this.prisma.aiMessage.create({ data: { sessionId, userId, role: 'assistant', content: assistantMessage } }),
      this.prisma.aiSession.update({
        where: { id: sessionId },
        data: { messageCount: { increment: 2 }, tokensUsed: { increment: tokensUsed } },
      }),
    ]);
  }

  private async extractAndStoreInsights(
    userId: string,
    agentType: string,
    userMessage: string,
    assistantMessage: string,
  ) {
    const combined = `${userMessage} ${assistantMessage}`;
    const pillars = this.detectPillars(combined);

    // Store key points as long-term memory
    if (combined.length > 200) {
      await this.prisma.aiMemory.create({
        data: {
          userId,
          memoryType: 'long_term',
          pillar: pillars[0] as any ?? null,
          content: combined.slice(0, 500),
          importance: 5,
          tags: [agentType, ...pillars],
        },
      });
    }
  }

  private detectPillars(text: string): string[] {
    const pillars: string[] = [];
    const lower = text.toLowerCase();
    if (/heart|relationship|family|emotion|love|gratitude/.test(lower)) pillars.push('heart');
    if (/hope|purpose|vision|goal|career|dream|mission/.test(lower)) pillars.push('hope');
    if (/health|fitness|sleep|nutrition|stress|energy|meditation/.test(lower)) pillars.push('health');
    if (/help|community|volunteer|mentor|impact|contribution/.test(lower)) pillars.push('help');
    return [...new Set(pillars)];
  }

  private extractActions(text: string): string[] {
    const actions: string[] = [];
    const lines = text.split('\n');
    for (const line of lines) {
      if (/^[-•*]\s+\*?\*?try|start|do|practice|take|schedule|set|write|reflect/i.test(line)) {
        actions.push(line.replace(/^[-•*]\s+/, '').replace(/\*\*/g, '').trim());
      }
    }
    return actions.slice(0, 3);
  }
}
