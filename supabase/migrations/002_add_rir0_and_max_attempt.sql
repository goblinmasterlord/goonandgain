-- Migration: Add RIR 0 support and is_max_attempt field
-- Run this in the Supabase SQL Editor after 001_initial_schema.sql

-- ============================================
-- UPDATE RIR CONSTRAINT TO ALLOW 0
-- ============================================
-- Drop the existing constraint
ALTER TABLE set_logs DROP CONSTRAINT IF EXISTS set_logs_rir_check;

-- Add new constraint allowing 0-4
ALTER TABLE set_logs ADD CONSTRAINT set_logs_rir_check CHECK (rir BETWEEN 0 AND 4);

-- ============================================
-- ADD IS_MAX_ATTEMPT COLUMN
-- ============================================
ALTER TABLE set_logs ADD COLUMN IF NOT EXISTS is_max_attempt BOOLEAN DEFAULT FALSE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN set_logs.rir IS 'Reps In Reserve: 0=failure, 1-2=near max, 3-4=too easy';
COMMENT ON COLUMN set_logs.is_max_attempt IS 'Heavy single/1RM attempt - excluded from progression algorithm';
