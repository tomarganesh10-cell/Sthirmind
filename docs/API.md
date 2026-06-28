# SthirMind API Reference

Base URL: `https://sthirmind.playplate.in/api/v1`
Auth: Bearer token (Clerk JWT)

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/webhook` | Clerk webhook handler (user created/updated) |
| GET  | `/auth/me` | Get current user |

---

## Users & Profiles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/users/me` | Get full user profile |
| PATCH  | `/users/me` | Update user |
| POST   | `/users/me/profile` | Create/update profile |
| GET    | `/users/me/blueprint` | Get life blueprints |
| POST   | `/users/me/blueprint/generate` | AI-generate blueprints |

---

## Assessment

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/assessment/onboarding` | Submit onboarding assessment |
| GET  | `/assessment/latest` | Get latest assessment |
| GET  | `/assessment/history` | Get assessment history |
| POST | `/assessment/weekly` | Submit weekly check-in |

---

## Happiness Engine

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/happiness/overview` | Dashboard overview (scores + user) |
| POST | `/happiness/checkin` | Daily 5H check-in |
| GET  | `/happiness/score/today` | Today's computed scores |
| GET  | `/happiness/trend/7days` | 7-day trend |
| GET  | `/happiness/trend/30days` | 30-day trend |
| GET  | `/happiness/weekly-report` | Latest weekly report |

---

## Heart Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/heart/relationships` | List relationships |
| POST   | `/heart/relationships` | Create relationship |
| PATCH  | `/heart/relationships/:id` | Update relationship |
| DELETE | `/heart/relationships/:id` | Archive relationship |
| POST   | `/heart/relationships/:id/interact` | Log interaction |
| GET    | `/heart/journal` | Get journal entries |
| POST   | `/heart/journal` | Create journal entry |
| POST   | `/heart/journal/voice` | Create voice journal |
| GET    | `/heart/gratitude` | Get gratitude entries |
| POST   | `/heart/gratitude` | Create gratitude entry |
| GET    | `/heart/emotions/timeline` | Emotion timeline |
| POST   | `/heart/emotions` | Log emotion |

---

## Hope Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/hope/goals` | List goals (filter: status, pillar) |
| POST   | `/hope/goals` | Create goal |
| PATCH  | `/hope/goals/:id` | Update goal |
| POST   | `/hope/goals/:id/checkin` | Goal check-in |
| GET    | `/hope/goals/:id/milestones` | Get milestones |
| POST   | `/hope/goals/:id/milestones` | Add milestone |
| GET    | `/hope/vision-boards` | Get vision boards |
| POST   | `/hope/vision-boards` | Create vision board |
| PATCH  | `/hope/vision-boards/:id` | Update vision board |

---

## Health Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/health/profile` | Health profile |
| POST   | `/health/profile` | Create/update health profile |
| GET    | `/health/logs` | Health logs (date range) |
| POST   | `/health/logs` | Create health log |
| PATCH  | `/health/logs/:date` | Update day's log |
| GET    | `/health/habits` | List habits |
| POST   | `/health/habits` | Create habit |
| PATCH  | `/health/habits/:id` | Update habit |
| GET    | `/health/habits/today` | Today's habits with completion |
| POST   | `/health/habits/:id/log` | Log habit completion |
| GET    | `/health/analysis/sleep` | Sleep analysis (30d) |
| GET    | `/health/analysis/stress` | Stress trend |
| GET    | `/health/burnout-risk` | AI burnout risk assessment |

---

## Help Module

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/help/impact-profile` | Impact + contribution profile |
| POST   | `/help/volunteer` | Log volunteer activity |
| GET    | `/help/volunteer` | Volunteer history |
| POST   | `/help/donations` | Log donation |
| GET    | `/help/donations` | Donation history |
| GET    | `/help/mentorship` | Mentorship connections |
| POST   | `/help/mentorship/request` | Request mentorship |
| PATCH  | `/help/mentorship/:id` | Update connection |

---

## AI Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST   | `/ai/chat` | Send message to agent |
| GET    | `/ai/sessions` | List sessions |
| GET    | `/ai/sessions/:id` | Get session + messages |
| DELETE | `/ai/sessions/:id` | End/delete session |
| GET    | `/ai/insights` | Get AI insights |
| PATCH  | `/ai/insights/:id/read` | Mark insight read |
| POST   | `/ai/blueprint/generate` | Generate life blueprint |
| POST   | `/ai/weekly-report/generate` | Generate weekly report |
| GET    | `/ai/memory` | Get user memories |
| DELETE | `/ai/memory/:id` | Delete memory |

**Chat Request:**
```json
{
  "message": "I'm feeling overwhelmed today",
  "agentType": "life_coach",
  "sessionId": "uuid (optional, creates new if omitted)"
}
```

**Agent Types:**
`life_coach` | `health_coach` | `purpose_coach` | `relationship_coach` |
`mental_wellness` | `habit_coach` | `impact_coach` | `productivity_coach` |
`leadership_coach` | `founder_coach` | `executive_coach` | `meditation_coach` |
`happiness_coach` | `community_coach` | `financial_wellness`

---

## Community

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/community` | List communities |
| POST   | `/community` | Create community |
| GET    | `/community/:slug` | Get community |
| POST   | `/community/:id/join` | Join community |
| POST   | `/community/:id/posts` | Create post |
| GET    | `/community/:id/posts` | Get posts (paginated) |
| POST   | `/community/:id/posts/:postId/reply` | Reply to post |
| POST   | `/community/:id/posts/:postId/like` | Like post |
| GET    | `/community/challenges` | List challenges |
| POST   | `/community/challenges/:id/join` | Join challenge |
| PATCH  | `/community/challenges/:id/progress` | Update challenge progress |

---

## Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/analytics/insights/today` | Today's AI insights |
| GET    | `/analytics/patterns` | Detected behavior patterns |
| GET    | `/analytics/predictions` | Risk predictions |
| GET    | `/analytics/overview` | Full analytics overview |
| GET    | `/analytics/xp` | XP + level + badges |
| GET    | `/analytics/badges` | Available badges |

---

## Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/subscriptions/plans` | Available plans |
| POST   | `/subscriptions/checkout` | Create Stripe checkout |
| POST   | `/subscriptions/razorpay/order` | Create Razorpay order |
| GET    | `/subscriptions/current` | Current subscription |
| DELETE | `/subscriptions/cancel` | Cancel subscription |
| POST   | `/subscriptions/webhook/stripe` | Stripe webhook |
| POST   | `/subscriptions/webhook/razorpay` | Razorpay webhook |

---

## Health Check

```
GET /health → { status: "ok", uptime: 123.4, db: "connected", cache: "connected" }
```

---

## Response Format

```json
{
  "data": { ... },
  "message": "Success",
  "statusCode": 200,
  "timestamp": "2026-06-25T10:30:00.000Z"
}
```

## Error Format

```json
{
  "message": "Validation failed",
  "statusCode": 422,
  "errors": [{ "field": "email", "message": "must be a valid email" }],
  "timestamp": "2026-06-25T10:30:00.000Z"
}
```
