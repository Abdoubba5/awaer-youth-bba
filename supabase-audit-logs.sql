-- ============================================================
-- منصة وعي الشباب BBA - Security Audit Logs Migration
-- Version: 1.0.0
--
-- Creates audit_logs table to track:
--   - Login (success/failure)
--   - Logout
--   - Content changes (create, update, delete)
--   - Certificate creation / reissue / deletion
--   - User role changes
--   - Data deletion (volunteers, consultations, events, etc.)
--   - Sensitive admin actions
--
-- This table is APPEND-ONLY. Records are never updated or deleted.
-- RLS: super_admin, admin can SELECT; only the audit module (via
-- service_role) or SECURITY DEFINER function can INSERT.
-- ============================================================

-- ============================================================
-- 1. CREATE audit_logs TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event classification
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failure', 'logout',
    'content_create', 'content_update', 'content_delete',
    'certificate_create', 'certificate_reissue', 'certificate_delete',
    'volunteer_approve', 'volunteer_reject', 'volunteer_suspend', 'volunteer_unsuspend', 'volunteer_delete', 'volunteer_edit',
    'role_change',
    'data_delete',
    'settings_change',
    'report_generate',
    'seed_data',
    'system'
  )),
  
  -- Who performed the action
  actor_id TEXT DEFAULT '',           -- auth.uid() or legacy user identifier
  actor_email TEXT DEFAULT '',        -- email for easy identification
  actor_role TEXT DEFAULT '',         -- role at time of action
  
  -- What was affected
  target_type TEXT DEFAULT '',        -- e.g. 'volunteer', 'certificate', 'consultation', 'event', 'user_role'
  target_id TEXT DEFAULT '',          -- the ID of the affected record
  target_summary TEXT DEFAULT '',     -- human-readable summary (e.g. volunteer name, cert number)
  
  -- Details
  details JSONB DEFAULT '{}',        -- flexible metadata about the event
  ip_address TEXT DEFAULT '',         -- client IP if available
  user_agent TEXT DEFAULT '',         -- browser user agent if available
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);
-- Composite index for the audit viewer: show recent events of a type by an actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_lookup ON audit_logs(created_at DESC, event_type, actor_id);


-- ============================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. RLS POLICIES
-- ============================================================

-- Only super_admin can INSERT into audit_logs (via SECURITY DEFINER function).
-- Anon and even admin cannot directly INSERT.
DROP POLICY IF EXISTS super_admin_insert_audit_logs ON audit_logs;
CREATE POLICY super_admin_insert_audit_logs ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (has_role('super_admin'));

-- super_admin and admin can SELECT (view) audit logs
DROP POLICY IF EXISTS super_admin_select_audit_logs ON audit_logs;
CREATE POLICY super_admin_select_audit_logs ON audit_logs
  FOR SELECT TO authenticated
  USING (has_role('super_admin'));

DROP POLICY IF EXISTS admin_select_audit_logs ON audit_logs;
CREATE POLICY admin_select_audit_logs ON audit_logs
  FOR SELECT TO authenticated
  USING (has_role('admin'));

-- Never allow UPDATE or DELETE on audit_logs (append-only)
-- No policies for UPDATE/DELETE = no one can modify, which is what we want.

-- Allow anon and authenticated to INSERT via the SECURITY DEFINER function
-- (The function will bypass RLS, so we need a policy that allows the function to work)
-- Actually, the function will use SECURITY DEFINER which runs as the definer.
-- For now, we only allow super_admin to INSERT directly.
-- The application will use a SECURITY DEFINER function to insert logs on behalf
-- of any authenticated user or even anonymous users.


-- ============================================================
-- 4. SECURITY DEFINER FUNCTION: insert_audit_log
-- ============================================================
-- This is the ONLY way audit logs should be inserted.
-- It runs with the privileges of the function definer (super_admin),
-- bypassing RLS so any authenticated user can log events.
-- Paranoid mode: we explicitly set search_path to avoid injection.
-- ============================================================

CREATE OR REPLACE FUNCTION public.insert_audit_log(
  p_event_type TEXT,
  p_actor_id TEXT DEFAULT '',
  p_actor_email TEXT DEFAULT '',
  p_actor_role TEXT DEFAULT '',
  p_target_type TEXT DEFAULT '',
  p_target_id TEXT DEFAULT '',
  p_target_summary TEXT DEFAULT '',
  p_details JSONB DEFAULT '{}',
  p_ip_address TEXT DEFAULT '',
  p_user_agent TEXT DEFAULT ''
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate event_type
  IF p_event_type NOT IN (
    'login_success', 'login_failure', 'logout',
    'content_create', 'content_update', 'content_delete',
    'certificate_create', 'certificate_reissue', 'certificate_delete',
    'volunteer_approve', 'volunteer_reject', 'volunteer_suspend', 'volunteer_unsuspend', 'volunteer_delete', 'volunteer_edit',
    'role_change',
    'data_delete',
    'settings_change',
    'report_generate',
    'seed_data',
    'system'
  ) THEN
    RAISE EXCEPTION 'Invalid audit event_type: %', p_event_type;
  END IF;

  INSERT INTO audit_logs (
    event_type, actor_id, actor_email, actor_role,
    target_type, target_id, target_summary,
    details, ip_address, user_agent
  ) VALUES (
    p_event_type, p_actor_id, p_actor_email, p_actor_role,
    p_target_type, p_target_id, p_target_summary,
    p_details, p_ip_address, p_user_agent
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;


-- ============================================================
-- 5. VERIFICATION QUERY
-- ============================================================
-- Uncomment to test:
-- SELECT insert_audit_log('system', 'migration', 'system@bba.dz', 'super_admin', 'system', 'schema', 'Audit logs table created', '{"version": "1.0.0"}'::jsonb);
-- SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;


-- ============================================================
-- SUMMARY
-- ============================================================
-- New table:     audit_logs (append-only)
-- Indexes:       5 (event_type, actor_id, created_at, target_type, lookup composite)
-- RLS policies:  3 (super_admin INSERT, super_admin SELECT, admin SELECT)
-- Functions:     1 (insert_audit_log - SECURITY DEFINER)
-- Audit events tracked: 20 event types across 6 categories
-- ============================================================

-- ✅ Migration ready. Run in Supabase SQL Editor.
