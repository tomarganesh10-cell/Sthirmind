-- ============================================================
-- STHIRMIND — Complete PostgreSQL Database Schema
-- 5H Framework: Heart · Hope · Health · Help → Happiness
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for AI embeddings

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'premium', 'pro', 'founder', 'enterprise', 'lifetime');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'trialing', 'paused');
CREATE TYPE pillar_type AS ENUM ('heart', 'hope', 'health', 'help');
CREATE TYPE agent_type AS ENUM (
  'life_coach', 'health_coach', 'purpose_coach', 'relationship_coach',
  'mental_wellness', 'habit_coach', 'impact_coach', 'productivity_coach',
  'leadership_coach', 'founder_coach', 'executive_coach', 'meditation_coach',
  'happiness_coach', 'community_coach', 'financial_wellness'
);
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE goal_status AS ENUM ('draft', 'active', 'completed', 'paused', 'cancelled');
CREATE TYPE goal_timeframe AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom');
CREATE TYPE habit_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE mood_level AS ENUM ('1','2','3','4','5','6','7','8','9','10');
CREATE TYPE content_type AS ENUM ('article', 'blog', 'podcast', 'course', 'micro_lesson', 'daily_wisdom', 'video');
CREATE TYPE relationship_type AS ENUM ('family', 'partner', 'friend', 'colleague', 'mentor', 'mentee', 'other');
CREATE TYPE community_role AS ENUM ('member', 'moderator', 'admin', 'mentor');
CREATE TYPE challenge_status AS ENUM ('upcoming', 'active', 'completed', 'cancelled');
CREATE TYPE notification_type AS ENUM ('push', 'email', 'in_app', 'sms');
CREATE TYPE ai_message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'non_binary', 'prefer_not_to_say', 'other');
CREATE TYPE leadership_archetype AS ENUM ('controller', 'avoider', 'pleaser', 'perfectionist', 'visionary', 'servant');
CREATE TYPE vipassana_level AS ENUM ('none', 'beginner', 'practitioner', 'advanced', 'teacher');

-- ============================================================
-- CORE USER TABLES
-- ============================================================

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id          VARCHAR(255) UNIQUE NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20),
  full_name         VARCHAR(255) NOT NULL,
  display_name      VARCHAR(100),
  avatar_url        TEXT,
  gender            gender_type,
  date_of_birth     DATE,
  timezone          VARCHAR(50) DEFAULT 'Asia/Kolkata',
  locale            VARCHAR(10) DEFAULT 'en-IN',
  country           VARCHAR(2) DEFAULT 'IN',
  city              VARCHAR(100),
  occupation        VARCHAR(200),
  industry          VARCHAR(100),
  linkedin_url      TEXT,
  is_active         BOOLEAN DEFAULT true,
  is_onboarded      BOOLEAN DEFAULT false,
  onboarded_at      TIMESTAMPTZ,
  last_active_at    TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_profiles (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bio                     TEXT,
  professional_summary    TEXT,
  years_experience        INT,
  company_name            VARCHAR(200),
  company_size            VARCHAR(50),
  revenue_range           VARCHAR(50),
  leadership_archetype    leadership_archetype,
  vipassana_level         vipassana_level DEFAULT 'none',
  vipassana_courses       INT DEFAULT 0,
  meditation_years        INT DEFAULT 0,
  daily_meditation_mins   INT DEFAULT 0,
  primary_challenge       TEXT,
  primary_goal            TEXT,
  values                  JSONB DEFAULT '[]',       -- ["integrity","growth","family"]
  strengths               JSONB DEFAULT '[]',
  growth_areas            JSONB DEFAULT '[]',
  referral_source         VARCHAR(100),
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE subscriptions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                subscription_tier NOT NULL DEFAULT 'free',
  status              subscription_status NOT NULL DEFAULT 'active',
  stripe_customer_id  VARCHAR(255),
  stripe_sub_id       VARCHAR(255),
  razorpay_sub_id     VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end  TIMESTAMPTZ,
  trial_end           TIMESTAMPTZ,
  cancel_at           TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  price_usd           DECIMAL(10,2),
  price_inr           DECIMAL(10,2),
  billing_interval    VARCHAR(20) DEFAULT 'monthly',
  metadata            JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5H ASSESSMENT & SCORES
-- ============================================================

CREATE TABLE assessments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_type   VARCHAR(50) NOT NULL,  -- 'onboarding', '30day', '90day', 'weekly'
  responses         JSONB NOT NULL DEFAULT '{}',
  raw_score         DECIMAL(5,2),
  -- 5H Scores (0-100 each)
  heart_score       DECIMAL(5,2),
  hope_score        DECIMAL(5,2),
  health_score      DECIMAL(5,2),
  help_score        DECIMAL(5,2),
  happiness_score   DECIMAL(5,2),
  -- Sub-scores
  emotional_iq      DECIMAL(5,2),
  relationship_health DECIMAL(5,2),
  purpose_clarity   DECIMAL(5,2),
  life_satisfaction DECIMAL(5,2),
  stress_index      DECIMAL(5,2),    -- lower is better
  burnout_risk      DECIMAL(5,2),    -- lower is better
  resilience_score  DECIMAL(5,2),
  mindfulness_score DECIMAL(5,2),
  leadership_score  DECIMAL(5,2),
  impact_score      DECIMAL(5,2),
  -- AI Analysis
  ai_insights       TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  archetype_result  leadership_archetype,
  completed_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE daily_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  heart_score     DECIMAL(5,2),
  hope_score      DECIMAL(5,2),
  health_score    DECIMAL(5,2),
  help_score      DECIMAL(5,2),
  happiness_score DECIMAL(5,2),
  mood            INT CHECK(mood BETWEEN 1 AND 10),
  energy          INT CHECK(energy BETWEEN 1 AND 10),
  stress          INT CHECK(stress BETWEEN 1 AND 10),
  gratitude_count INT DEFAULT 0,
  habits_completed INT DEFAULT 0,
  habits_total    INT DEFAULT 0,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE life_blueprints (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blueprint_type      VARCHAR(50) NOT NULL,  -- 'purpose','health','relationship','impact','life'
  version             INT DEFAULT 1,
  title               VARCHAR(200),
  summary             TEXT,
  vision_statement    TEXT,
  core_values         JSONB DEFAULT '[]',
  key_priorities      JSONB DEFAULT '[]',
  milestones          JSONB DEFAULT '[]',
  action_plan         JSONB DEFAULT '[]',
  ai_generated        BOOLEAN DEFAULT true,
  is_active           BOOLEAN DEFAULT true,
  generated_at        TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEART MODULE
-- ============================================================

CREATE TABLE relationships (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  relationship_type   relationship_type NOT NULL,
  photo_url           TEXT,
  birthday            DATE,
  notes               TEXT,
  health_score        INT CHECK(health_score BETWEEN 0 AND 100),
  connection_strength INT CHECK(connection_strength BETWEEN 0 AND 100),
  last_connected_at   DATE,
  remind_every_days   INT,
  tags                TEXT[],
  is_archived         BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE relationship_interactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50),   -- 'call','message','meeting','gift','prayer'
  quality_score   INT CHECK(quality_score BETWEEN 1 AND 10),
  notes           TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(500),
  content         TEXT NOT NULL,
  is_voice        BOOLEAN DEFAULT false,
  audio_url       TEXT,
  transcript      TEXT,
  pillar_tags     pillar_type[],
  mood_before     INT CHECK(mood_before BETWEEN 1 AND 10),
  mood_after      INT CHECK(mood_after BETWEEN 1 AND 10),
  energy_level    INT CHECK(energy_level BETWEEN 1 AND 10),
  ai_sentiment    VARCHAR(50),
  ai_themes       TEXT[],
  ai_insights     TEXT,
  embedding       vector(1536),   -- for semantic search
  is_private      BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gratitude_entries (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items       TEXT[] NOT NULL,    -- ["I'm grateful for...", ...]
  reflection  TEXT,
  mood        INT CHECK(mood BETWEEN 1 AND 10),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE emotion_timeline (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emotion         VARCHAR(100) NOT NULL,
  intensity       INT CHECK(intensity BETWEEN 1 AND 10),
  trigger         TEXT,
  context         TEXT,
  pillar          pillar_type,
  recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HOPE MODULE
-- ============================================================

CREATE TABLE goals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_goal_id  UUID REFERENCES goals(id),
  pillar          pillar_type,
  title           VARCHAR(500) NOT NULL,
  description     TEXT,
  why             TEXT,           -- Simon Sinek WHY
  timeframe       goal_timeframe NOT NULL,
  status          goal_status DEFAULT 'draft',
  priority        INT DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
  progress_pct    INT DEFAULT 0 CHECK(progress_pct BETWEEN 0 AND 100),
  target_value    DECIMAL(15,2),
  current_value   DECIMAL(15,2) DEFAULT 0,
  unit            VARCHAR(50),
  target_date     DATE,
  completed_at    TIMESTAMPTZ,
  ai_success_probability DECIMAL(5,2),
  ai_coaching_notes TEXT,
  tags            TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goal_milestones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id     UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(500) NOT NULL,
  due_date    DATE,
  completed   BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE goal_check_ins (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_pct    INT,
  current_value   DECIMAL(15,2),
  reflection      TEXT,
  blockers        TEXT,
  wins            TEXT,
  ai_response     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vision_boards (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  items       JSONB DEFAULT '[]',  -- [{type:'image'|'text'|'goal', content, position}]
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- HEALTH MODULE
-- ============================================================

CREATE TABLE health_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  height_cm           DECIMAL(5,1),
  weight_kg           DECIMAL(5,1),
  blood_type          VARCHAR(5),
  medical_conditions  TEXT[],
  medications         TEXT[],
  allergies           TEXT[],
  fitness_level       VARCHAR(50),   -- 'sedentary','light','moderate','active','athlete'
  primary_health_goal VARCHAR(200),
  sleep_goal_hrs      DECIMAL(3,1) DEFAULT 7.5,
  steps_goal          INT DEFAULT 8000,
  water_goal_ml       INT DEFAULT 2500,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE health_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  -- Sleep
  sleep_hrs       DECIMAL(3,1),
  sleep_quality   INT CHECK(sleep_quality BETWEEN 1 AND 10),
  sleep_start     TIME,
  sleep_end       TIME,
  -- Activity
  steps           INT,
  active_mins     INT,
  calories_burned INT,
  workout_type    VARCHAR(100),
  workout_mins    INT,
  -- Nutrition
  calories_intake INT,
  water_ml        INT,
  meals           JSONB DEFAULT '[]',
  -- Mental
  stress_level    INT CHECK(stress_level BETWEEN 1 AND 10),
  anxiety_level   INT CHECK(anxiety_level BETWEEN 1 AND 10),
  meditation_mins INT,
  -- Vitals
  heart_rate_resting INT,
  hrv             INT,
  weight_kg       DECIMAL(5,1),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE TABLE habits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pillar          pillar_type NOT NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  frequency       habit_frequency DEFAULT 'daily',
  target_count    INT DEFAULT 1,
  duration_mins   INT,
  icon            VARCHAR(10),
  color           VARCHAR(7),
  cue             TEXT,     -- habit loop: cue
  routine         TEXT,     -- habit loop: routine
  reward          TEXT,     -- habit loop: reward
  is_active       BOOLEAN DEFAULT true,
  streak_current  INT DEFAULT 0,
  streak_best     INT DEFAULT 0,
  total_completed INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE habit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id    UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  count       INT DEFAULT 1,
  duration_mins INT,
  quality     INT CHECK(quality BETWEEN 1 AND 5),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- ============================================================
-- HELP MODULE
-- ============================================================

CREATE TABLE impact_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  volunteer_hours     DECIMAL(8,2) DEFAULT 0,
  donations_total_inr DECIMAL(12,2) DEFAULT 0,
  people_mentored     INT DEFAULT 0,
  lives_impacted      INT DEFAULT 0,
  impact_score        DECIMAL(5,2) DEFAULT 0,
  legacy_score        DECIMAL(5,2) DEFAULT 0,
  cause_areas         TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE volunteer_activities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization    VARCHAR(200),
  activity_type   VARCHAR(100),
  description     TEXT,
  hours           DECIMAL(6,2) NOT NULL,
  impact_estimate TEXT,
  occurred_date   DATE NOT NULL,
  verified        BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization    VARCHAR(200) NOT NULL,
  amount_inr      DECIMAL(10,2) NOT NULL,
  currency        VARCHAR(3) DEFAULT 'INR',
  cause           VARCHAR(100),
  recurring       BOOLEAN DEFAULT false,
  payment_ref     VARCHAR(200),
  donated_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE mentorship_connections (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mentee_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  focus_area      VARCHAR(200),
  status          VARCHAR(50) DEFAULT 'pending',   -- pending,active,completed,declined
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AI AGENTS & SESSIONS
-- ============================================================

CREATE TABLE ai_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type      agent_type NOT NULL,
  status          session_status DEFAULT 'active',
  title           VARCHAR(500),
  context         JSONB DEFAULT '{}',   -- injected context for the session
  metadata        JSONB DEFAULT '{}',
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  duration_secs   INT,
  message_count   INT DEFAULT 0,
  tokens_used     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            ai_message_role NOT NULL,
  content         TEXT NOT NULL,
  is_voice        BOOLEAN DEFAULT false,
  audio_url       TEXT,
  metadata        JSONB DEFAULT '{}',
  tokens          INT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_memory (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  memory_type     VARCHAR(50) NOT NULL,  -- 'short_term','long_term','episodic','semantic'
  pillar          pillar_type,
  content         TEXT NOT NULL,
  embedding       vector(1536),
  importance      INT DEFAULT 5 CHECK(importance BETWEEN 1 AND 10),
  access_count    INT DEFAULT 0,
  last_accessed   TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  tags            TEXT[],
  source_session  UUID REFERENCES ai_sessions(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type      agent_type,
  insight_type    VARCHAR(100),    -- 'pattern','prediction','recommendation','warning'
  pillar          pillar_type,
  title           VARCHAR(300),
  content         TEXT NOT NULL,
  confidence      DECIMAL(3,2),    -- 0.0 to 1.0
  is_read         BOOLEAN DEFAULT false,
  is_actioned     BOOLEAN DEFAULT false,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY PLATFORM
-- ============================================================

CREATE TABLE communities (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(200) UNIQUE NOT NULL,
  description     TEXT,
  pillar          pillar_type,
  cover_url       TEXT,
  icon_url        TEXT,
  member_count    INT DEFAULT 0,
  is_public       BOOLEAN DEFAULT true,
  requires_approval BOOLEAN DEFAULT false,
  created_by      UUID NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE community_members (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id    UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role            community_role DEFAULT 'member',
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

CREATE TABLE community_posts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id    UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_post_id  UUID REFERENCES community_posts(id),
  content         TEXT NOT NULL,
  media_urls      TEXT[],
  like_count      INT DEFAULT 0,
  reply_count     INT DEFAULT 0,
  is_pinned       BOOLEAN DEFAULT false,
  is_moderated    BOOLEAN DEFAULT false,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenges (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  pillar          pillar_type NOT NULL,
  status          challenge_status DEFAULT 'upcoming',
  duration_days   INT NOT NULL,
  start_date      DATE,
  end_date        DATE,
  participant_count INT DEFAULT 0,
  cover_url       TEXT,
  rules           JSONB DEFAULT '[]',
  rewards         JSONB DEFAULT '{}',
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE challenge_participants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenge_id    UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  progress_pct    INT DEFAULT 0,
  points          INT DEFAULT 0,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  joined_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================================
-- CONTENT ECOSYSTEM
-- ============================================================

CREATE TABLE content_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(500) NOT NULL,
  slug            VARCHAR(500) UNIQUE NOT NULL,
  content_type    content_type NOT NULL,
  pillar          pillar_type,
  description     TEXT,
  body            TEXT,
  cover_url       TEXT,
  audio_url       TEXT,
  video_url       TEXT,
  duration_mins   INT,
  author_id       UUID REFERENCES users(id),
  tags            TEXT[],
  read_time_mins  INT,
  view_count      INT DEFAULT 0,
  like_count      INT DEFAULT 0,
  is_premium      BOOLEAN DEFAULT false,
  is_published    BOOLEAN DEFAULT false,
  published_at    TIMESTAMPTZ,
  embedding       vector(1536),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE learning_paths (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  pillar          pillar_type,
  items           JSONB DEFAULT '[]',    -- [{content_id, order, completed}]
  ai_generated    BOOLEAN DEFAULT true,
  progress_pct    INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_content_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_id      UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  progress_pct    INT DEFAULT 0,
  completed       BOOLEAN DEFAULT false,
  completed_at    TIMESTAMPTZ,
  last_position   INT DEFAULT 0,  -- seconds for audio/video
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- ============================================================
-- GAMIFICATION
-- ============================================================

CREATE TABLE user_xp (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_xp        INT DEFAULT 0,
  level           INT DEFAULT 1,
  pillar_xp       JSONB DEFAULT '{"heart":0,"hope":0,"health":0,"help":0}',
  badges          JSONB DEFAULT '[]',
  streak_current  INT DEFAULT 0,
  streak_best     INT DEFAULT 0,
  last_activity   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE xp_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          INT NOT NULL,
  reason          VARCHAR(200) NOT NULL,
  pillar          pillar_type,
  source_type     VARCHAR(100),   -- 'habit','goal','journal','challenge','session'
  source_id       UUID,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE badges (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(100) UNIQUE NOT NULL,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  icon        TEXT,
  pillar      pillar_type,
  criteria    JSONB NOT NULL DEFAULT '{}',
  xp_reward   INT DEFAULT 0,
  rarity      VARCHAR(20) DEFAULT 'common',  -- common,rare,epic,legendary
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS & PREDICTIONS
-- ============================================================

CREATE TABLE behavior_patterns (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pattern_type    VARCHAR(100),   -- 'peak_hours','mood_trigger','habit_correlation'
  description     TEXT NOT NULL,
  data            JSONB DEFAULT '{}',
  confidence      DECIMAL(3,2),
  detected_at     TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

CREATE TABLE predictions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prediction_type VARCHAR(100),   -- 'burnout','goal_success','habit_break','mood_dip'
  pillar          pillar_type,
  probability     DECIMAL(3,2),
  description     TEXT,
  recommended_actions JSONB DEFAULT '[]',
  is_actioned     BOOLEAN DEFAULT false,
  predicted_for   DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_reports (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_start      DATE NOT NULL,
  week_end        DATE NOT NULL,
  happiness_avg   DECIMAL(5,2),
  heart_avg       DECIMAL(5,2),
  hope_avg        DECIMAL(5,2),
  health_avg      DECIMAL(5,2),
  help_avg        DECIMAL(5,2),
  habits_rate     DECIMAL(5,2),
  goals_progress  JSONB DEFAULT '{}',
  wins            JSONB DEFAULT '[]',
  challenges      JSONB DEFAULT '[]',
  ai_narrative    TEXT,
  recommendations JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- ============================================================
-- RETREATS & EVENTS
-- ============================================================

CREATE TABLE events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(300) NOT NULL,
  description     TEXT,
  event_type      VARCHAR(100),   -- 'retreat','webinar','masterclass','workshop'
  pillar          pillar_type,
  location        VARCHAR(200),
  is_virtual      BOOLEAN DEFAULT false,
  meeting_url     TEXT,
  max_capacity    INT,
  price_inr       DECIMAL(10,2),
  price_usd       DECIMAL(10,2),
  starts_at       TIMESTAMPTZ NOT NULL,
  ends_at         TIMESTAMPTZ NOT NULL,
  cover_url       TEXT,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE event_registrations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_status  VARCHAR(50) DEFAULT 'pending',
  payment_ref     VARCHAR(200),
  attended        BOOLEAN DEFAULT false,
  registered_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            notification_type NOT NULL,
  title           VARCHAR(300) NOT NULL,
  body            TEXT,
  data            JSONB DEFAULT '{}',
  is_read         BOOLEAN DEFAULT false,
  read_at         TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  morning_checkin BOOLEAN DEFAULT true,
  morning_time    TIME DEFAULT '07:00',
  evening_reflect BOOLEAN DEFAULT true,
  evening_time    TIME DEFAULT '21:00',
  habit_reminders BOOLEAN DEFAULT true,
  goal_nudges     BOOLEAN DEFAULT true,
  ai_insights     BOOLEAN DEFAULT true,
  community_notif BOOLEAN DEFAULT true,
  weekly_report   BOOLEAN DEFAULT true,
  email_digest    BOOLEAN DEFAULT true,
  push_enabled    BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Users
CREATE INDEX idx_users_clerk ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Scores
CREATE INDEX idx_daily_scores_user_date ON daily_scores(user_id, date DESC);
CREATE INDEX idx_assessments_user ON assessments(user_id, created_at DESC);

-- Journal & Memory (vector search)
CREATE INDEX idx_journal_embedding ON journal_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_ai_memory_embedding ON ai_memory USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_ai_memory_user ON ai_memory(user_id, memory_type, importance DESC);

-- Habits
CREATE INDEX idx_habit_logs_user_date ON habit_logs(user_id, date DESC);
CREATE INDEX idx_habits_user_pillar ON habits(user_id, pillar);

-- Goals
CREATE INDEX idx_goals_user_status ON goals(user_id, status);
CREATE INDEX idx_goals_user_pillar ON goals(user_id, pillar);

-- Community
CREATE INDEX idx_community_posts_community ON community_posts(community_id, created_at DESC);
CREATE INDEX idx_community_posts_embedding ON community_posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- AI Sessions
CREATE INDEX idx_ai_sessions_user ON ai_sessions(user_id, created_at DESC);
CREATE INDEX idx_ai_messages_session ON ai_messages(session_id, created_at ASC);

-- Analytics
CREATE INDEX idx_predictions_user_type ON predictions(user_id, prediction_type, created_at DESC);
CREATE INDEX idx_behavior_patterns_user ON behavior_patterns(user_id, pattern_type);

-- Content
CREATE INDEX idx_content_type_pillar ON content_items(content_type, pillar, is_published);
CREATE INDEX idx_content_embedding ON content_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Notifications
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_upd BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_upd BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_goals_upd BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_habits_upd BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_journal_upd BEFORE UPDATE ON journal_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_blueprints_upd BEFORE UPDATE ON life_blueprints FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_ai_memory_upd BEFORE UPDATE ON ai_memory FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_relationships_upd BEFORE UPDATE ON relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_upd BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_communities_upd BEFORE UPDATE ON communities FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_content_upd BEFORE UPDATE ON content_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_xp_upd BEFORE UPDATE ON user_xp FOR EACH ROW EXECUTE FUNCTION update_updated_at();
