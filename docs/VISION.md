# SthirMind — Complete Vision Document

> **Lead With Clarity. Build With Equanimity.**
> *sthirmind.playplate.in*

---

## The Problem We Solve

The world's most successful leaders are often its most unfulfilled people.

They build revenue. They build teams. They build companies.
They don't build themselves.

After a decade of building a $100M business, the founder asked:
*"Why do I feel empty?"*

The answer was the **5H Framework** — born from 80+ days of Vipassana silence,
thousands of leadership conversations, and the hard-won wisdom that
**Happiness is the most important business metric.**

---

## What SthirMind Is

**Not** a productivity app.
**Not** a meditation app.
**Not** a coaching app.

A complete **AI-Powered Human Operating System** — the world's first.

Like iOS for your iPhone, SthirMind is the OS for your human life.
It runs 15 specialized AI agents, tracks every dimension of your flourishing,
and delivers a unified **Happiness Score** driven by four pillars:

```
        ❤️ HEART
       /         \
  ✨ HOPE     HEALTH 💪
       \         /
        🤝 HELP

          ↓
     😊 HAPPINESS
```

---

## The 5H Framework

### CENTER: HAPPINESS
The master metric. Not hedonistic pleasure — *eudaimonic flourishing*.
Sustainable, meaningful, resilient wellbeing.

### H1 — HEART (Weight: 28%)
Relationships, Emotional Intelligence, Gratitude, Self-Awareness, Compassion, Family

*Why 28%?* Harvard's 85-year Study of Adult Development found:
"The clearest message from this 75-year study is this:
Good relationships keep us happier and healthier. Period."

### H2 — HOPE (Weight: 25%)
Purpose, Vision, Goals, Career Meaning, Dreams, Mission

*Why 25%?* Seligman's PERMA model puts Meaning and Engagement at the core of flourishing.
Viktor Frankl: "Those who have a WHY to live can bear almost any HOW."

### H3 — HEALTH (Weight: 27%)
Physical Fitness, Sleep, Nutrition, Stress Management, Mental Wellness, Longevity

*Why 27%?* The body is the hardware the OS runs on. No hardware → no software.
WHO data: Physical + mental health directly determine cognitive performance and lifespan.

### H4 — HELP (Weight: 20%)
Community, Volunteering, Mentorship, Social Impact, Contribution, Legacy

*Why 20%?* Research on ikigai, meaning, and longevity consistently shows:
People who contribute to others live longer and report higher satisfaction.

---

## The Happiness Score Formula

```
H_score = 0.28 × Heart + 0.25 × Hope + 0.27 × Health + 0.20 × Help

Each pillar = weighted composite of its sub-dimensions.
Score range: 0–100.

Tiers:
  0–39:  Struggling     → 🌱 Foundation mode
  40–59: Developing     → 🌿 Growth mode
  60–79: Flourishing    → 🌸 Flourishing mode
  80+:   Thriving       → ✨ Thriving mode

Balance Index: How evenly distributed the 4 pillars are (0=imbalanced, 100=perfectly balanced)
Momentum Score: Trend direction over last 30 days (+/-10 = significant shift)
```

---

## AI Agent Architecture

15 specialized AI agents, each an expert in its domain, all sharing:
- User's complete context (assessments, goals, habits, memory)
- 5H framework knowledge base
- Vipassana + mindfulness tradition
- Behavioral science research
- The user's personal history

**Core Agents:**
1. Life Coach — integrated 5H guide, default entry point
2. Health Coach — integrative wellness expert
3. Purpose Coach — vision & meaning architect
4. Relationship Coach — EQ + connection expert
5. Mental Wellness — CBT/ACT/mindfulness therapist
6. Habit Coach — behavioral design specialist
7. Impact Coach — contribution + legacy guide
8. Productivity Coach — execution systems
9. Leadership Coach — team & org dynamics
10. Founder Coach — startup + scale wisdom
11. Executive Coach — C-suite + board navigation
12. Meditation Coach — Vipassana + daily practice
13. Happiness Coach — positive psychology expert
14. Community Coach — belonging + contribution
15. Financial Wellness — money + life alignment

---

## Memory System

**Short-term Memory** (session context, last 20 messages)
**Long-term Memory** (semantic embeddings, key insights, patterns)
**Episodic Memory** (life events, milestones, journal themes)
**Relationship Memory** (people, interactions, quality scores)
**Health Memory** (biometric trends, habit patterns, sleep data)
**Goal Memory** (progress, blockers, wins)

All memories stored with:
- Vector embeddings (1536 dimensions, pgvector)
- Importance scoring (1–10)
- Pillar tagging
- Decay functions (recency weighting)
- Semantic retrieval at inference time

---

## Tech Stack

```
Frontend:     Next.js 14 + React 18 + TypeScript + Tailwind CSS
Backend:      NestJS + Node.js 20
Database:     PostgreSQL 16 + pgvector
Cache:        Redis 7
Search:       Meilisearch
Vector DB:    Pinecone (external) + pgvector (local)
AI:           Claude (Anthropic) — primary
              OpenAI GPT-4o — fallback/specialized
              ElevenLabs — voice synthesis
Auth:         Clerk
Payments:     Stripe (global) + Razorpay (India)
Analytics:    PostHog
Hosting:      Hostinger VPS (primary)
CDN:          Cloudflare
Monitoring:   Grafana + Prometheus + Loki
CI/CD:        GitHub Actions
```

---

## Subscription Model

| Tier | Price | Target |
|------|-------|--------|
| Explorer | Free | Individual discovery |
| Leader | $49/month | Growth-oriented leader |
| Executive | $199/month | Senior exec / founder |
| Team | $5K–10K/year | Corporate team |
| Enterprise | Custom | Large org / B2B |
| Lifetime | $999 | Power users |

**India pricing:** INR equivalents with Razorpay

**Unit Economics (Target):**
- CAC: $50–80 (organic/content-led)
- LTV: $1,200 (Leader) / $4,800 (Executive)
- Gross Margin: 82%
- Churn Target: <3%/month
- NPS Target: 70+

---

## Roadmap to $100M ARR

### Phase 0+1 (Day 1–90): Foundation & Beta
- 50 validation conversations
- MVP v1 live
- 100 beta users
- 3–5 corporate pilots
- 2,000+ LinkedIn followers
- **KPI:** 150+ paying users, $50K MRR

### Phase 2 (Month 4–12): Scale
- 1,000+ paying users
- AI Coach 2.0 (voice-first)
- Team Dynamics Module
- 20 corporate clients
- **KPI:** $500K ARR

### Phase 3 (Year 2–3): Growth Engine
- 10,000+ paying users
- Mobile app (iOS + Android)
- B2B SaaS product
- Southeast Asia expansion
- **KPI:** $5M ARR

### Phase 4 (Year 4–5): Global Scale
- 100,000+ users
- Enterprise platform
- Retreat network (10 cities)
- White-label for leadership institutes
- **KPI:** $50M ARR

### Phase 5 (Year 6–7): Unicorn
- 1M+ users
- Global B2B
- AI research lab
- **KPI:** $100M ARR

---

## Team Structure (90-Day)

- **CEO/Founder:** Product vision, corporate pilots, content
- **CTO (hire by Day 30):** Technical architecture, MVP
- **AI Engineer (hire by Day 45):** Agent development, prompts
- **Full-Stack Engineer ×2 (hire by Day 45):** Product build
- **Growth Lead (hire by Day 60):** LinkedIn, content, community

---

## The Founder Story

After building a $100M company (Domino's India / Jubilant FoodWorks),
the founder discovered in 80+ days of Vipassana silence that:

*"The entire journey of business building had been an unconscious attempt
to fill an inner void. The moment I stopped running and sat still,
I found what I was actually looking for."*

SthirMind is the system he wished he had when building his first company.
For every leader who wants to build something extraordinary
without sacrificing the things that matter most.

---

*Heart · Hope · Health · Help → Happiness*
*Lead With Clarity. Build With Equanimity.*
