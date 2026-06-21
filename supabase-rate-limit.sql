-- ============================================================
-- منصة وعي الشباب BBA - Server-Side Rate Limiting Migration
-- Version: 1.0.0
--
-- Enforces rate limits at the database level using:
--   • A rate_limits tracking table
--   • SECURITY DEFINER PostgreSQL functions (can be called via
--     supabaseClient.rpc() from the browser)
--   • Sliding window, exponential backoff, and daily limits
--     matching the client-side js/rate-limiter.js config
--
-- Even when the client-side rate limiter is bypassed or tampered
-- with, the server will block excessive requests using auth.uid()
-- for authenticated users or a passed identifier for anonymous.
--
-- ⚠️  For true IP-based rate limiting, use the Edge Function
--     (see supabase/edge-functions/rate-limit/).
--     This SQL approach uses auth.uid() (reliable) or a passed
--     client identifier (can be forged, but an additional layer).
--
-- Run order:
--   1. supabase-schema.sql
--   2. supabase-rls-strict.sql
--   3. supabase-audit-logs.sql
--   4. supabase-certificates-fraud.sql
--   5. supabase-rate-limit.sql (THIS FILE)
-- ============================================================

-- ============================================================
-- 1. CREATE rate_limits TABLE
-- ============================================================
-- Stores rate limit state per (action_type, identifier) pair.
-- identifier = auth.uid() for authenticated users, or a
-- hash/device_id for anonymous requests.
-- ============================================================
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Action type (login, consultation, volunteer_registration, etc.)
  action_type TEXT NOT NULL,

  -- Identifier: auth.uid() for authenticated, or device fingerprint hash
  identifier TEXT NOT NULL,

  -- Timestamps of recent attempts (sliding window)
  attempts JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Block expiry (NULL = not blocked)
  blocked_until TIMESTAMPTZ DEFAULT NULL,

  -- Number of times the user has been blocked (for exponential backoff)
  block_count INTEGER NOT NULL DEFAULT 0,

  -- Last attempt timestamp
  last_attempt TIMESTAMPTZ DEFAULT NULL,

  -- Daily counter
  daily_count INTEGER NOT NULL DEFAULT 0,
  daily_date DATE DEFAULT CURRENT_DATE,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one record per (action_type, identifier)
CREATE UNIQUE INDEX IF NOT EXISTS idx_rate_limits_action_identifier ON rate_limits(action_type, identifier);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON rate_limits(updated_at);


-- ============================================================
-- 2. HELPER FUNCTIONS
-- ============================================================


-- Resolve the identifier to use for rate limiting.
-- For authenticated users, uses auth.uid().
-- For anonymous users, uses the passed client_identifier or
-- a fallback IP-based hash (passed from Edge Function).
CREATE OR REPLACE FUNCTION public.resolve_rate_limit_identifier(
  p_client_identifier TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL THEN 'auth:' || auth.uid()::text
    WHEN p_client_identifier IS NOT NULL AND p_client_identifier != '' THEN 'anon:' || p_client_identifier
    ELSE 'anon:unknown'
  END;
$$;


-- ============================================================
-- 3. CORE RATE LIMIT FUNCTIONS
-- ============================================================

-- Check if an action is allowed.
-- Returns a JSONB result matching the client-side format.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_cooldown_seconds INTEGER DEFAULT 10,
  p_daily_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
  v_record rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_window_cutoff TIMESTAMPTZ;
  v_recent_attempts JSONB;
  v_attempt_count INTEGER;
  v_cooldown_remaining NUMERIC;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Resolve identifier
  v_identifier := public.resolve_rate_limit_identifier(p_client_identifier);

  -- Get or create record
  INSERT INTO rate_limits (action_type, identifier)
  VALUES (p_action_type, v_identifier)
  ON CONFLICT (action_type, identifier) DO NOTHING;

  SELECT * INTO v_record
  FROM rate_limits
  WHERE action_type = p_action_type AND identifier = v_identifier
  FOR UPDATE;

  -- If no record (should not happen), allow
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'allowed', true,
      'server_enforced', true,
      'message', '',
      'identifier', v_identifier
    );
  END IF;

  -- 1. Check if currently blocked
  IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
    v_blocked_until := v_record.blocked_until;
    RETURN jsonb_build_object(
      'allowed', false,
      'server_enforced', true,
      'message', '🔒 تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.',
      'blocked_until', v_record.blocked_until,
      'remaining_seconds', EXTRACT(EPOCH FROM (v_record.blocked_until - v_now))::INTEGER,
      'identifier', v_identifier
    );
  END IF;

  -- 2. Check cooldown
  IF v_record.last_attempt IS NOT NULL THEN
    v_cooldown_remaining := EXTRACT(EPOCH FROM (v_now - v_record.last_attempt));
    IF v_cooldown_remaining < p_cooldown_seconds THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'server_enforced', true,
        'message', '⏳ يرجى الانتظار ' || CEIL(p_cooldown_seconds - v_cooldown_remaining)::TEXT || ' ثانية قبل المحاولة مرة أخرى',
        'cooldown_remaining', CEIL(p_cooldown_seconds - v_cooldown_remaining)::INTEGER,
        'identifier', v_identifier
      );
    END IF;
  END IF;

  -- 3. Check sliding window (clean old attempts first)
  v_window_cutoff := v_now - (p_window_minutes * INTERVAL '1 minute');
  v_recent_attempts := v_record.attempts;

  -- Filter out old attempts
  SELECT jsonb_agg(value) INTO v_recent_attempts
  FROM jsonb_array_elements(v_record.attempts)
  WHERE (value->>'t')::TIMESTAMPTZ >= v_window_cutoff;

  IF v_recent_attempts IS NULL THEN
    v_recent_attempts := '[]'::jsonb;
  END IF;

  v_attempt_count := jsonb_array_length(v_recent_attempts);

  IF v_attempt_count >= p_max_attempts THEN
    -- Block with exponential backoff
    RETURN jsonb_build_object(
      'allowed', false,
      'server_enforced', true,
      'should_backoff', true,
      'message', '🔒 تم تجاوز عدد المحاولات المسموح بها.',
      'attempts', v_attempt_count,
      'max_attempts', p_max_attempts,
      'window_minutes', p_window_minutes,
      'identifier', v_identifier
    );
  END IF;

  -- 4. Check daily limit
  IF v_record.daily_date = CURRENT_DATE AND v_record.daily_count >= p_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'server_enforced', true,
      'message', '🚫 تم تجاوز الحد اليومي المسموح به. يرجى المحاولة غداً.',
      'daily_count', v_record.daily_count,
      'daily_limit', p_daily_limit,
      'identifier', v_identifier
    );
  END IF;

  -- Prune old attempts from stored array to prevent unbounded growth
  -- (only write back if the count actually changed)
  IF jsonb_array_length(v_recent_attempts) < jsonb_array_length(v_record.attempts) THEN
    UPDATE rate_limits
    SET attempts = v_recent_attempts
    WHERE id = v_record.id;
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'server_enforced', true,
    'message', '',
    'remaining', p_max_attempts - v_attempt_count,
    'daily_remaining', GREATEST(0, p_daily_limit - CASE WHEN v_record.daily_date = CURRENT_DATE THEN v_record.daily_count ELSE 0 END),
    'identifier', v_identifier
  );
END;
$$;


-- Record (increment) an attempt for a given action.
-- Should be called AFTER check_rate_limit returns allowed = true
-- (or after a failed action that should count toward the limit).
CREATE OR REPLACE FUNCTION public.record_rate_limit(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_record rate_limits%ROWTYPE;
  v_updated_attempts JSONB;
BEGIN
  v_identifier := public.resolve_rate_limit_identifier(p_client_identifier);

  -- Upsert: create if not exists, update if exists
  INSERT INTO rate_limits (action_type, identifier, attempts, last_attempt, daily_count, daily_date)
  VALUES (p_action_type, v_identifier, jsonb_build_array(jsonb_build_object('t', v_now)), v_now, 1, CURRENT_DATE)
  ON CONFLICT (action_type, identifier) DO UPDATE SET
    attempts = CASE
      WHEN rate_limits.daily_date = CURRENT_DATE THEN
        rate_limits.attempts || jsonb_build_object('t', v_now)
      ELSE
        jsonb_build_array(jsonb_build_object('t', v_now))
    END,
    last_attempt = v_now,
    daily_count = CASE
      WHEN rate_limits.daily_date = CURRENT_DATE THEN rate_limits.daily_count + 1
      ELSE 1
    END,
    daily_date = CURRENT_DATE,
    updated_at = v_now;

  RETURN jsonb_build_object(
    'success', true,
    'recorded', true,
    'identifier', v_identifier,
    'at', v_now
  );
END;
$$;


-- Reset rate limit state for an action (e.g., on successful login).
CREATE OR REPLACE FUNCTION public.reset_rate_limit(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
BEGIN
  v_identifier := public.resolve_rate_limit_identifier(p_client_identifier);

  UPDATE rate_limits
  SET
    attempts = '[]'::jsonb,
    blocked_until = NULL,
    block_count = 0,
    last_attempt = NULL,
    daily_count = 0,
    daily_date = CURRENT_DATE,
    updated_at = NOW()
  WHERE action_type = p_action_type AND identifier = v_identifier;

  RETURN jsonb_build_object(
    'success', true,
    'reset', true,
    'identifier', v_identifier
  );
END;
$$;


-- Apply exponential backoff: called when check_rate_limit
-- detects the sliding window is full. Returns the block duration.
CREATE OR REPLACE FUNCTION public.backoff_rate_limit(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL,
  p_backoff_base_minutes INTEGER DEFAULT 15,
  p_max_block_hours INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
  v_block_count INTEGER;
  v_backoff_minutes INTEGER;
  v_block_until TIMESTAMPTZ;
BEGIN
  v_identifier := public.resolve_rate_limit_identifier(p_client_identifier);

  -- Get current block count, default 0
  SELECT COALESCE(block_count, 0) INTO v_block_count
  FROM rate_limits
  WHERE action_type = p_action_type AND identifier = v_identifier;

  -- Calculate exponential backoff: base * 2^count, capped at max
  v_backoff_minutes := LEAST(
    p_backoff_base_minutes * (2 ^ v_block_count),
    p_max_block_hours * 60
  );

  v_block_until := NOW() + (v_backoff_minutes * INTERVAL '1 minute');

  UPDATE rate_limits
  SET
    blocked_until = v_block_until,
    block_count = v_block_count + 1,
    attempts = '[]'::jsonb,
    updated_at = NOW()
  WHERE action_type = p_action_type AND identifier = v_identifier;

  RETURN jsonb_build_object(
    'success', true,
    'blocked_until', v_block_until,
    'backoff_minutes', v_backoff_minutes,
    'block_count', v_block_count + 1,
    'identifier', v_identifier
  );
END;
$$;


-- Get current rate limit status (for UI display).
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL,
  p_window_minutes INTEGER DEFAULT 15,
  p_max_attempts INTEGER DEFAULT 5,
  p_daily_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_identifier TEXT;
  v_record rate_limits%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
  v_window_cutoff TIMESTAMPTZ;
  v_attempt_count INTEGER;
  v_recent_attempts JSONB;
BEGIN
  v_identifier := public.resolve_rate_limit_identifier(p_client_identifier);

  SELECT * INTO v_record
  FROM rate_limits
  WHERE action_type = p_action_type AND identifier = v_identifier;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'found', false,
      'remaining', p_max_attempts,
      'daily_remaining', p_daily_limit,
      'blocked', false,
      'identifier', v_identifier
    );
  END IF;

  -- Count recent attempts in sliding window
  v_window_cutoff := v_now - (p_window_minutes * INTERVAL '1 minute');
  SELECT jsonb_agg(value) INTO v_recent_attempts
  FROM jsonb_array_elements(v_record.attempts)
  WHERE (value->>'t')::TIMESTAMPTZ >= v_window_cutoff;

  IF v_recent_attempts IS NULL THEN
    v_attempt_count := 0;
  ELSE
    v_attempt_count := jsonb_array_length(v_recent_attempts);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'remaining', GREATEST(0, p_max_attempts - v_attempt_count),
    'daily_remaining', GREATEST(0, p_daily_limit - CASE WHEN v_record.daily_date = CURRENT_DATE THEN v_record.daily_count ELSE 0 END),
    'blocked', v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now,
    'blocked_until', v_record.blocked_until,
    'block_count', v_record.block_count,
    'total_attempts_today', CASE WHEN v_record.daily_date = CURRENT_DATE THEN v_record.daily_count ELSE 0 END,
    'identifier', v_identifier
  );
END;
$$;


-- Atomic check + record: combines check and record into a single
-- RPC call to eliminate the race condition between separate check
-- and record calls.
-- Returns the same JSONB as check_rate_limit, but also records
-- the attempt if allowed.
CREATE OR REPLACE FUNCTION public.check_and_record_rate_limit(
  p_action_type TEXT,
  p_client_identifier TEXT DEFAULT NULL,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_cooldown_seconds INTEGER DEFAULT 10,
  p_daily_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check JSONB;
  v_record JSONB;
BEGIN
  -- First, check the rate limit
  v_check := public.check_rate_limit(
    p_action_type, p_client_identifier,
    p_max_attempts, p_window_minutes, p_cooldown_seconds, p_daily_limit
  );

  -- If allowed, record the attempt atomically
  IF (v_check->>'allowed')::boolean = true THEN
    v_record := public.record_rate_limit(p_action_type, p_client_identifier);
    RETURN v_check || jsonb_build_object('recorded', true);
  END IF;

  -- If the check said we should backoff, apply the backoff
  IF (v_check->>'should_backoff')::boolean = true THEN
    v_record := public.backoff_rate_limit(
      p_action_type, p_client_identifier,
      CASE
        WHEN p_action_type = 'login' THEN 15
        WHEN p_action_type = 'volunteer_registration' THEN 60
        WHEN p_action_type = 'consultation' THEN 30
        WHEN p_action_type = 'certificate_verify' THEN 15
        WHEN p_action_type = 'portal_login' THEN 15
        ELSE 15
      END,
      CASE
        WHEN p_action_type = 'login' THEN 24
        WHEN p_action_type = 'volunteer_registration' THEN 24
        WHEN p_action_type = 'consultation' THEN 12
        WHEN p_action_type = 'certificate_verify' THEN 6
        WHEN p_action_type = 'portal_login' THEN 24
        ELSE 24
      END
    );
    RETURN v_check || jsonb_build_object('backoff_applied', true, 'recorded', false);
  END IF;

  -- Not allowed and no backoff needed — just return the check result
  RETURN v_check || jsonb_build_object('recorded', false);
END;
$$;


-- Cleanup: Remove stale records older than 30 days
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM rate_limits
  WHERE updated_at < NOW() - INTERVAL '30 days'
    AND (blocked_until IS NULL OR blocked_until < NOW());

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;


-- ============================================================
-- 4. ENABLE RLS ON rate_limits TABLE
-- ============================================================
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access policies needed — all operations go through
-- SECURITY DEFINER functions (check_rate_limit, record_rate_limit, etc.)
-- which bypass RLS automatically.
-- Deny all direct table access to prevent tampering.
DROP POLICY IF EXISTS deny_all_rate_limits ON rate_limits;
CREATE POLICY deny_all_rate_limits ON rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);


-- ============================================================
-- 5. VERIFICATION QUERIES
-- ============================================================
-- Uncomment to test:

-- Test check (should allow)
-- SELECT check_rate_limit('login', 'test-device-001', 5, 15, 10, 20);

-- Test record
-- SELECT record_rate_limit('login', 'test-device-001');

-- Test check after record (should show 4 remaining)
-- SELECT check_rate_limit('login', 'test-device-001', 5, 15, 10, 20);

-- Test reset
-- SELECT reset_rate_limit('login', 'test-device-001');

-- Test status
-- SELECT get_rate_limit_status('login', 'test-device-001', 15, 5, 20);

-- Test backoff
-- SELECT backoff_rate_limit('login', 'test-device-001', 15, 24);

-- Cleanup old records
-- SELECT cleanup_rate_limits();


-- ============================================================
-- SUMMARY
-- ============================================================
-- New table:      rate_limits (tracks attempts per action+identifier)
-- New indexes:    2 (action+identifier unique, updated_at)
-- New functions:  7 (resolve_identifier, check, record, reset, backoff, status, cleanup)
-- RLS:            deny_all (only SECURITY DEFINER functions can access)
--
-- Call from client JS:
--   const { data, error } = await supabaseClient.rpc('check_rate_limit', {
--     p_action_type: 'login',
--     p_client_identifier: deviceId,
--     p_max_attempts: 5,
--     p_window_minutes: 15,
--     p_cooldown_seconds: 10,
--     p_daily_limit: 20
--   });
-- ============================================================

-- ✅ Migration ready. Run in Supabase SQL Editor.
