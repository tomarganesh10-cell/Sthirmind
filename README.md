# 🧘 SthirMind

> **Lead With Clarity. Build With Equanimity.**

**The world's first AI-Powered Human Operating System** built on the 5H Framework.

```
        ❤️ HEART ──────────── 🌟 HOPE
              \              /
               \            /
                ✨ HAPPINESS
               /            \
              /              \
        💪 HEALTH ──────────── 🤝 HELP
```

---

## What Is SthirMind?

Not a productivity app. Not a meditation app. Not a coaching platform.

A **complete Human OS** — 15 AI agents, a Happiness Engine, knowledge graphs,
memory systems, community, and a 90-day sprint tracker — all built around
one question: *Are you truly flourishing?*

---

## The 5H Framework

| Pillar | Weight | Focus |
|--------|--------|-------|
| ❤️ Heart  | 28% | Relationships, EQ, Gratitude |
| 🌟 Hope   | 25% | Purpose, Vision, Goals |
| 💪 Health | 27% | Body, Mind, Sleep, Stress |
| 🤝 Help   | 20% | Community, Impact, Legacy |
| 😊 **Happiness** | **Master** | **Weighted composite** |

---

## Monorepo Structure

```
sthirmind/
├── apps/
│   ├── web/              # Next.js 14 frontend
│   │   ├── src/app/      # App Router pages
│   │   ├── src/components/
│   │   │   ├── happiness/ # HappinessRing etc.
│   │   │   ├── ai/        # AiChatBubble
│   │   │   ├── shared/    # PillarCard, DailyCheckin
│   │   │   └── ...
│   │   └── public/
│   │       └── 90day-tracker.html  # Sprint tracker
│   └── api/              # NestJS REST API
│       └── src/modules/
│           ├── ai/        # 15 AI agents (Claude)
│           ├── happiness/ # Happiness Engine + formula
│           ├── heart/     # Relationships, journals
│           ├── hope/      # Goals, vision boards
│           ├── health/    # Habits, health logs
│           ├── help/      # Impact, volunteering
│           └── ...
├── packages/
│   └── db/
│       └── schema.sql    # Complete PostgreSQL schema
├── infra/
│   ├── docker-compose.yml
│   └── nginx/nginx.conf
├── docs/
│   ├── VISION.md          # Complete vision + $100M roadmap
│   ├── ARCHITECTURE.md    # System architecture diagrams
│   └── API.md             # Complete API reference
└── .github/workflows/
    └── ci-cd.yml          # CI/CD pipeline
```

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd sthirmind
pnpm install

# 2. Configure environment
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, DATABASE_URL, CLERK_*, STRIPE_*

# 3. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 4. Run migrations + seed
pnpm db:migrate && pnpm db:seed

# 5. Start development
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

---

## Key Features

### 🤖 15 AI Agents (Claude-powered)
Each expert in their domain. All knowing your full context.
Life Coach · Health Coach · Purpose Coach · Relationship Coach · Executive Coach · and 10 more.

### 📊 Happiness Engine
Mathematical model computing your master Happiness Score from 4 pillars.
Daily computation, weekly reports, trend analysis, burnout prediction.

### 🧠 Memory System
Short-term (session) + Long-term (semantic embeddings) + Episodic memory.
pgvector for semantic search. AI that actually *remembers* you.

### ❤️ Heart Module
Relationship Health Scores, Voice Journaling with AI analysis,
Gratitude tracking, Emotion Timeline, EQ assessment.

### 🌟 Hope Module
Goal Architecture with AI success probability scoring,
Vision Board, Purpose Discovery Engine, Life Roadmap.

### 💪 Health Module
Sleep, fitness, nutrition, stress tracking. Habit system with
streak tracking, habit loop design, daily practice engine.

### 🤝 Help Module
Volunteer activity tracking, donation logging, mentorship connections,
Impact Score, Legacy Score, community challenges.

### 🏆 Gamification
XP system, leveling, badges (Common/Rare/Epic/Legendary),
pillar-specific XP, streaks, challenges.

### 📱 Progressive Web App
Mobile-first, installable, works offline for journaling + habits.

---

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** NestJS, Node.js 20
- **Database:** PostgreSQL 16 + pgvector
- **Cache:** Redis 7
- **Search:** Meilisearch
- **AI:** Claude (Anthropic) primary, OpenAI fallback
- **Auth:** Clerk
- **Payments:** Stripe + Razorpay
- **Analytics:** PostHog
- **Hosting:** Hostinger VPS + Cloudflare

---

## 90-Day Sprint Tracker

Open `/90day-tracker.html` in your browser for the interactive
sprint planning tool with all 90 days of tasks, KPI tracking,
progress charts, and daily check-ins.

---

## Roadmap

| Phase | Timeline | Target |
|-------|----------|--------|
| 0+1: Foundation | Day 1–90 | 150 paying users, $50K MRR |
| 2: Scale | Month 4–12 | 1,000 users, $500K ARR |
| 3: Growth | Year 2–3 | 10K users, $5M ARR |
| 4: Global | Year 4–5 | 100K users, $50M ARR |
| 5: Unicorn | Year 6–7 | 1M users, $100M ARR |

---

## Documentation

- [Vision & $100M Roadmap](docs/VISION.md)
- [Technical Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)

---

*Heart · Hope · Health · Help → Happiness*
*© 2026 SthirMind · sthirmind.playplate.in*
