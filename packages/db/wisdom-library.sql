-- ═══════════════════════════════════════════════════════════════════
-- STHIRMIND WISDOM LIBRARY — DATABASE SCHEMA
-- World-class AI-powered learning platform
-- ═══════════════════════════════════════════════════════════════════

-- ── Enums ─────────────────────────────────────────────────────────────────────

CREATE TYPE summary_length AS ENUM ('one_min', 'five_min', 'fifteen_min');
CREATE TYPE audio_voice AS ENUM ('male', 'female', 'mentor', 'founder', 'meditation');
CREATE TYPE audio_provider AS ENUM ('elevenlabs', 'openai', 'gemini');
CREATE TYPE book_status AS ENUM ('want_to_read', 'reading', 'completed', 'paused');
CREATE TYPE lesson_category AS ENUM (
  'business', 'leadership', 'marketing', 'startup', 'fundraising',
  'health', 'relationships', 'mindset', 'productivity', 'spirituality',
  'finance', 'creativity', 'communication', 'heart', 'hope', 'help'
);
CREATE TYPE knowledge_node_type AS ENUM (
  'book', 'concept', 'quote', 'insight', 'goal', 'habit',
  'relationship', 'life_event', 'mental_model', 'person'
);

-- ── Books Catalog ──────────────────────────────────────────────────────────────

CREATE TABLE wisdom_books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  author          TEXT NOT NULL,
  isbn            TEXT UNIQUE,
  description     TEXT,
  cover_url       TEXT,
  published_year  INT,
  category        TEXT,
  tags            TEXT[]              DEFAULT '{}',
  pillar_tags     pillar_type[]       DEFAULT '{}',
  page_count      INT,
  language        TEXT                DEFAULT 'en',
  source_url      TEXT,               -- official/legal source
  is_public       BOOLEAN             DEFAULT TRUE,
  wisdom_score    FLOAT               DEFAULT 0,  -- community rating
  view_count      INT                 DEFAULT 0,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  updated_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── User Book Library ─────────────────────────────────────────────────────────

CREATE TABLE user_books (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id         UUID REFERENCES wisdom_books(id) ON DELETE SET NULL,
  -- for user-uploaded books
  custom_title    TEXT,
  custom_author   TEXT,
  file_url        TEXT,               -- S3 URL of uploaded PDF
  file_size_mb    FLOAT,
  status          book_status         DEFAULT 'want_to_read',
  progress_pct    FLOAT               DEFAULT 0,
  current_page    INT                 DEFAULT 0,
  rating          INT CHECK (rating BETWEEN 1 AND 5),
  personal_note   TEXT,
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  updated_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── AI Book Summaries ─────────────────────────────────────────────────────────

CREATE TABLE book_summaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id         UUID NOT NULL REFERENCES wisdom_books(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = public summary
  length          summary_length NOT NULL,
  content         TEXT NOT NULL,
  key_lessons     JSONB               DEFAULT '[]',   -- [{lesson, pillar, example}]
  action_items    TEXT[]              DEFAULT '{}',
  quotes          JSONB               DEFAULT '[]',   -- [{text, context}]
  mental_models   JSONB               DEFAULT '[]',   -- [{name, description, example}]
  life_apps       JSONB               DEFAULT '{}',   -- {heart, hope, health, help}
  founder_apps    TEXT[]              DEFAULT '{}',
  leadership_apps TEXT[]              DEFAULT '{}',
  health_apps     TEXT[]              DEFAULT '{}',
  happiness_boost JSONB               DEFAULT '{}',   -- pillar impacts
  model_used      TEXT                DEFAULT 'claude-sonnet-4-6',
  tokens_used     INT                 DEFAULT 0,
  generated_at    TIMESTAMPTZ         DEFAULT now(),
  is_public       BOOLEAN             DEFAULT FALSE,
  UNIQUE(book_id, user_id, length)
);

-- ── Audio Narrations ──────────────────────────────────────────────────────────

CREATE TABLE book_audio (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_id      UUID NOT NULL REFERENCES book_summaries(id) ON DELETE CASCADE,
  voice           audio_voice NOT NULL,
  provider        audio_provider      DEFAULT 'openai',
  audio_url       TEXT,               -- S3/CDN URL
  duration_sec    INT,
  file_size_mb    FLOAT,
  voice_id        TEXT,               -- provider-specific voice ID
  background_music TEXT,              -- optional: ambient/binaural
  created_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── User Listening Sessions ───────────────────────────────────────────────────

CREATE TABLE listening_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  audio_id        UUID NOT NULL REFERENCES book_audio(id) ON DELETE CASCADE,
  started_at      TIMESTAMPTZ         DEFAULT now(),
  ended_at        TIMESTAMPTZ,
  duration_sec    INT                 DEFAULT 0,
  completed       BOOLEAN             DEFAULT FALSE,
  speed           FLOAT               DEFAULT 1.0,
  last_position   INT                 DEFAULT 0      -- seconds
);

-- ── Personal Knowledge Vault ──────────────────────────────────────────────────

CREATE TABLE knowledge_notes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_book_id    UUID REFERENCES user_books(id) ON DELETE SET NULL,
  book_id         UUID REFERENCES wisdom_books(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,      -- 'highlight','note','voice_note','learning','quote'
  content         TEXT NOT NULL,
  voice_url       TEXT,               -- for voice notes
  page_ref        INT,
  chapter_ref     TEXT,
  pillar_tags     pillar_type[]       DEFAULT '{}',
  tags            TEXT[]              DEFAULT '{}',
  lesson_category lesson_category,
  embedding       vector(1536),       -- for semantic search
  is_starred      BOOLEAN             DEFAULT FALSE,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  updated_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── Knowledge Graph Nodes ─────────────────────────────────────────────────────

CREATE TABLE knowledge_nodes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            knowledge_node_type NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  source_id       UUID,               -- references book, goal, habit etc.
  source_type     TEXT,
  pillar          pillar_type,
  weight          FLOAT               DEFAULT 1.0,  -- importance score
  embedding       vector(1536),
  metadata        JSONB               DEFAULT '{}',
  created_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── Knowledge Graph Edges ─────────────────────────────────────────────────────

CREATE TABLE knowledge_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_node_id  UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  target_node_id  UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL,      -- 'teaches','supports','contradicts','applies_to','related_to'
  strength        FLOAT               DEFAULT 0.5,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  UNIQUE(source_node_id, target_node_id, relation_type)
);

-- ── Daily Wisdom Feed ─────────────────────────────────────────────────────────

CREATE TABLE daily_wisdom (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  quote           TEXT NOT NULL,
  quote_author    TEXT,
  audio_lesson_id UUID REFERENCES book_audio(id) ON DELETE SET NULL,
  insight         TEXT NOT NULL,
  reflection_q    TEXT NOT NULL,
  source_book_id  UUID REFERENCES wisdom_books(id),
  pillar_focus    pillar_type,
  is_delivered    BOOLEAN             DEFAULT FALSE,
  opened_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── Book Chat Sessions ────────────────────────────────────────────────────────

CREATE TABLE book_chat_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id         UUID NOT NULL REFERENCES wisdom_books(id) ON DELETE CASCADE,
  title           TEXT,
  message_count   INT                 DEFAULT 0,
  created_at      TIMESTAMPTZ         DEFAULT now(),
  updated_at      TIMESTAMPTZ         DEFAULT now()
);

CREATE TABLE book_chat_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES book_chat_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL,      -- 'user' | 'assistant'
  content         TEXT NOT NULL,
  cited_pages     INT[]               DEFAULT '{}',
  created_at      TIMESTAMPTZ         DEFAULT now()
);

-- ── Learning Analytics ────────────────────────────────────────────────────────

CREATE TABLE wisdom_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  books_read      INT                 DEFAULT 0,
  summaries_read  INT                 DEFAULT 0,
  minutes_listened INT                DEFAULT 0,
  notes_created   INT                 DEFAULT 0,
  lessons_learned INT                 DEFAULT 0,
  knowledge_score FLOAT               DEFAULT 0,
  consistency_score FLOAT             DEFAULT 0,
  wisdom_score    FLOAT               DEFAULT 0,
  happiness_delta FLOAT               DEFAULT 0,  -- impact on happiness score
  created_at      TIMESTAMPTZ         DEFAULT now(),
  UNIQUE(user_id, date)
);

-- ── Wisdom Recommendations ────────────────────────────────────────────────────

CREATE TABLE wisdom_recommendations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  book_id         UUID NOT NULL REFERENCES wisdom_books(id),
  score           FLOAT               DEFAULT 0,   -- recommendation strength
  reasons         TEXT[]              DEFAULT '{}',
  pillar_match    JSONB               DEFAULT '{}',
  generated_at    TIMESTAMPTZ         DEFAULT now(),
  is_dismissed    BOOLEAN             DEFAULT FALSE
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_wisdom_books_tags ON wisdom_books USING GIN(tags);
CREATE INDEX idx_wisdom_books_pillar ON wisdom_books USING GIN(pillar_tags);
CREATE INDEX idx_user_books_user ON user_books(user_id);
CREATE INDEX idx_book_summaries_book ON book_summaries(book_id);
CREATE INDEX idx_knowledge_notes_user ON knowledge_notes(user_id);
CREATE INDEX idx_knowledge_notes_embed ON knowledge_notes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_nodes_user ON knowledge_nodes(user_id);
CREATE INDEX idx_knowledge_nodes_embed ON knowledge_nodes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_knowledge_edges_source ON knowledge_edges(source_node_id);
CREATE INDEX idx_daily_wisdom_user_date ON daily_wisdom(user_id, date);
CREATE INDEX idx_book_chat_user ON book_chat_sessions(user_id, book_id);
CREATE INDEX idx_wisdom_analytics_user ON wisdom_analytics(user_id, date);
CREATE INDEX idx_listening_sessions_user ON listening_sessions(user_id);
