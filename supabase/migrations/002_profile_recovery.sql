-- GoonAndGain Profile Recovery Schema
-- Run this in the Supabase SQL Editor AFTER 001_initial_schema.sql

-- Enable pgcrypto for PIN hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- ADD PROFILE FIELDS TO USERS TABLE
-- ============================================

-- Profile name (globally unique, case-insensitive)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_name TEXT;

-- Recovery PIN hash (bcrypt)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS recovery_pin_hash TEXT;

-- Split type (was missing from sync)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS split_type TEXT DEFAULT 'bro-split';

-- Last active timestamp (for recovery hints)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- ============================================
-- INDEXES
-- ============================================

-- Unique index for case-insensitive profile names
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_profile_name_lower
ON users(LOWER(profile_name))
WHERE profile_name IS NOT NULL;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check if profile name is available
CREATE OR REPLACE FUNCTION check_profile_name_available(p_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM users
    WHERE LOWER(profile_name) = LOWER(p_name)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to register a profile with hashed PIN
CREATE OR REPLACE FUNCTION register_profile(
  p_user_id UUID,
  p_profile_name TEXT,
  p_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_hash TEXT;
BEGIN
  -- Check if name is available
  IF NOT check_profile_name_available(p_profile_name) THEN
    RETURN FALSE;
  END IF;

  -- Hash the PIN using bcrypt
  v_hash := crypt(p_pin, gen_salt('bf', 8));

  -- Update the user record
  UPDATE users
  SET
    profile_name = p_profile_name,
    recovery_pin_hash = v_hash
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify recovery credentials and return user data
CREATE OR REPLACE FUNCTION verify_recovery(
  p_profile_name TEXT,
  p_pin TEXT
)
RETURNS TABLE (
  id UUID,
  created_at TIMESTAMPTZ,
  current_weight_kg DECIMAL,
  gender TEXT,
  birth_year INTEGER,
  training_days JSONB,
  weight_updated_at TIMESTAMPTZ,
  split_type TEXT,
  profile_name TEXT,
  last_active_at TIMESTAMPTZ,
  session_count BIGINT,
  total_sets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.created_at,
    u.current_weight_kg,
    u.gender,
    u.birth_year,
    u.training_days,
    u.weight_updated_at,
    u.split_type,
    u.profile_name,
    u.last_active_at,
    (SELECT COUNT(*) FROM sessions s WHERE s.user_id = u.id)::BIGINT as session_count,
    (SELECT COUNT(*) FROM set_logs sl
     JOIN sessions s ON sl.session_id = s.id
     WHERE s.user_id = u.id)::BIGINT as total_sets
  FROM users u
  WHERE LOWER(u.profile_name) = LOWER(p_profile_name)
    AND u.recovery_pin_hash IS NOT NULL
    AND u.recovery_pin_hash = crypt(p_pin, u.recovery_pin_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to change PIN (requires current PIN verification)
CREATE OR REPLACE FUNCTION change_recovery_pin(
  p_user_id UUID,
  p_current_pin TEXT,
  p_new_pin TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_hash TEXT;
  v_new_hash TEXT;
BEGIN
  -- Get current hash
  SELECT recovery_pin_hash INTO v_current_hash
  FROM users
  WHERE id = p_user_id;

  -- Verify current PIN
  IF v_current_hash IS NULL OR v_current_hash != crypt(p_current_pin, v_current_hash) THEN
    RETURN FALSE;
  END IF;

  -- Hash new PIN and update
  v_new_hash := crypt(p_new_pin, gen_salt('bf', 8));

  UPDATE users
  SET recovery_pin_hash = v_new_hash
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update last_active_at when completing a session
CREATE OR REPLACE FUNCTION update_last_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    UPDATE users
    SET last_active_at = NEW.completed_at
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_active_at
DROP TRIGGER IF EXISTS trigger_update_last_active ON sessions;
CREATE TRIGGER trigger_update_last_active
AFTER UPDATE ON sessions
FOR EACH ROW
EXECUTE FUNCTION update_last_active();
