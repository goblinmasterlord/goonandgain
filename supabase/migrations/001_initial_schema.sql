-- GoonAndGain Supabase Schema
-- Run this in the Supabase SQL Editor to create all tables

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_weight_kg DECIMAL(5,2) NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  birth_year INTEGER,
  training_days JSONB DEFAULT '{}',
  weight_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WEIGHT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS weight_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight_kg DECIMAL(5,2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_weight_history_user ON weight_history(user_id, recorded_at DESC);

-- ============================================
-- SESSIONS TABLE (Workout Sessions)
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  local_id BIGINT NOT NULL,
  UNIQUE(user_id, local_id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id, date DESC);

-- ============================================
-- SET LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS set_logs (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(6,2) NOT NULL,
  added_weight_kg DECIMAL(5,2),
  reps INTEGER NOT NULL,
  rir INTEGER NOT NULL CHECK (rir BETWEEN 1 AND 4),
  logged_at TIMESTAMPTZ NOT NULL,
  local_id BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_set_logs_session ON set_logs(session_id);

-- ============================================
-- ESTIMATED MAXES TABLE (1RM History)
-- ============================================
CREATE TABLE IF NOT EXISTS estimated_maxes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  estimated_1rm DECIMAL(6,2) NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL,
  local_id BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_estimated_maxes_user ON estimated_maxes(user_id, exercise_id);

-- ============================================
-- AI FEEDBACK TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ai_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('post_workout', 'weekly', 'alert', 'on_demand')),
  content TEXT NOT NULL,
  data_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  local_id BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================
-- Note: Since we're not using Supabase Auth, RLS is disabled.
-- If you add auth later, enable RLS and create policies.

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE estimated_maxes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (for when auth is added):
-- CREATE POLICY "Users can access own data" ON users
--   FOR ALL USING (auth.uid() = id);
