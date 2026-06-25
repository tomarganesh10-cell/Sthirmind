# SthirMind — Technical Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN / WAF                   │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    NGINX REVERSE PROXY                    │
│              (SSL termination, rate limiting)             │
└────────────┬────────────────────────────────┬────────────┘
             │                                │
┌────────────▼────────────┐  ┌────────────────▼────────────┐
│   NEXT.JS WEB APP       │  │   NESTJS REST API           │
│   (SSR + Static)        │  │   (Port 3001)               │
│   Port 3000             │  │                             │
│                         │  │   Modules:                  │
│   Pages:                │  │   ├─ Auth (Clerk webhooks)  │
│   ├─ Homepage           │  │   ├─ Users + Profiles       │
│   ├─ Onboarding         │  │   ├─ Assessment             │
│   ├─ Dashboard          │  │   ├─ Heart / Hope /         │
│   ├─ 5H Pillars         │  │   │  Health / Help          │
│   ├─ AI Chat            │  │   ├─ Happiness Engine       │
│   ├─ Community          │  │   ├─ AI Agents (Claude)     │
│   ├─ Content            │  │   ├─ Community              │
│   └─ Admin              │  │   ├─ Content                │
└─────────────────────────┘  │   ├─ Analytics              │
                             │   ├─ Subscriptions          │
                             │   └─ Notifications          │
                             └────────────┬────────────────┘
                                          │
            ┌─────────────────────────────┼──────────────────────────┐
            │                             │                          │
┌───────────▼───────────┐  ┌─────────────▼────────────┐  ┌──────────▼──────────┐
│  POSTGRESQL 16         │  │  REDIS 7                 │  │  MEILISEARCH        │
│  + pgvector            │  │  (Cache + Sessions +     │  │  (Full-text search) │
│                        │  │   Job Queues via Bull)   │  │                     │
│  Tables:               │  │                          │  │  Indexes:           │
│  ├─ users              │  │  Keys:                   │  │  ├─ content         │
│  ├─ user_profiles      │  │  ├─ session:{userId}     │  │  ├─ community_posts │
│  ├─ subscriptions      │  │  ├─ ratelimit:{ip}       │  │  └─ users           │
│  ├─ assessments        │  │  ├─ ai_context:{userId}  │  └─────────────────────┘
│  ├─ daily_scores       │  │  ├─ kpi_cache:{userId}   │
│  ├─ goals              │  │  └─ emb:{hash}           │
│  ├─ habits             │  └──────────────────────────┘
│  ├─ journal_entries    │
│  ├─ ai_sessions        │           EXTERNAL SERVICES
│  ├─ ai_messages        │  ┌────────────────────────────────────┐
│  ├─ ai_memory          │  │  Claude API (Anthropic)            │
│  ├─ relationships      │  │  OpenAI API (embeddings)           │
│  ├─ communities        │  │  Clerk (auth + webhooks)           │
│  ├─ content_items      │  │  Stripe / Razorpay (payments)      │
│  └─ ... (30+ tables)   │  │  Pinecone (vector search)          │
└────────────────────────┘  │  ElevenLabs (voice synthesis)      │
                            │  Resend (transactional email)       │
                            │  PostHog (product analytics)        │
                            │  Sentry (error monitoring)          │
                            │  Grafana + Prometheus (metrics)     │
                            └────────────────────────────────────┘
```

## Data Flow: AI Coaching Session

```
User types message
        ↓
Next.js → POST /api/v1/ai/chat
        ↓
Clerk middleware validates JWT
        ↓
AiController → AiService.chat()
        ↓
1. Load/create AI session (PostgreSQL)
2. Build user context:
   - Profile + assessment scores
   - 7-day score trend
   - Top 10 long-term memories (pgvector semantic search)
   - Active goals + recent habit logs
3. Load session history (last 20 messages)
4. Build system prompt = agent_prompt + user_context
5. Call Claude API (claude-sonnet-4-6)
6. Persist user + assistant messages
7. Async: extract insights → store in ai_memory
8. Return response
        ↓
Next.js streams response to UI
```

## Happiness Score Computation

```
Every evening at 22:00 UTC via scheduled job:

For each active user:
1. Fetch today's data (health logs, habits, journals, goals)
2. Compute Heart Score (relationships + emotions)
3. Compute Hope Score (goals + purpose)
4. Compute Health Score (sleep + exercise + stress)
5. Compute Help Score (volunteer + community + mentorship)
6. Apply weights → Happiness Score
7. Upsert daily_scores table
8. Check against predictions → trigger alerts if needed
9. Award XP for completed habits/goals
```

## Security Architecture

- **Authentication:** Clerk (JWT RS256)
- **Authorization:** Role-based guards in NestJS
- **Rate Limiting:** Nginx (global) + NestJS Throttler (API)
- **Input Validation:** class-validator + Zod
- **SQL Injection:** Prisma ORM (parameterized queries only)
- **XSS:** Helmet + CSP headers
- **Data Encryption:** AES-256 for sensitive fields
- **Secrets:** Environment variables, never in code
- **HTTPS:** TLS 1.3 with HSTS
- **Monitoring:** Sentry for errors, suspicious patterns flagged
