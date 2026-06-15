-- ============================================================
-- منصة وعي الشباب BBA - RLS Security Migration
-- Replaces public anon_all policies with proper auth-based RLS.
--
-- This migration should be run AFTER users and roles are set up.
--
-- Policy strategy:
--   PUBLIC (unauthenticated): SELECT only on CMS/public tables
--   AUTHENTICATED users:     INSERT/UPDATE/DELETE based on role
--   SUPER_ADMIN:             Full access to all tables
--   ADMIN:                   Management access
--   PSYCHOLOGIST:            Access to consultations only
--   VOLUNTEER:               Read own data, update own profile
-- ============================================================

-- ============================================================
-- 1. DROP ALL OLD PUBLIC POLICIES
-- ============================================================
DO $$ BEGIN
  -- Drop anon_all policies from every table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS anon_all_' || tablename || ' ON ' || tablename || ';', ' ')
    FROM pg_tables WHERE schemaname = 'public'
  );
END $$;

-- ============================================================
-- 2. HELPER: Check if user has a specific role
-- ============================================================
CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
  );
$$;

CREATE OR REPLACE FUNCTION has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(required_roles)
  );
$$;

-- ============================================================
-- 3. PUBLIC (ANONYMOUS) POLICIES
-- ============================================================

-- Volunteers: public can INSERT (registration), but not read/update/delete
DROP POLICY IF EXISTS public_insert_volunteers ON volunteers;
CREATE POLICY public_insert_volunteers ON volunteers
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS public_select_volunteers ON volunteers;
CREATE POLICY public_select_volunteers ON volunteers
  FOR SELECT TO anon
  USING (false);  -- Anonymous users cannot read volunteer data

-- Consultations: public can INSERT (submit consultation), select own by tracking code
DROP POLICY IF EXISTS public_insert_consultations ON consultations;
CREATE POLICY public_insert_consultations ON consultations
  FOR INSERT TO anon
  WITH CHECK (true);

-- Certificates: public can SELECT by certificate_number (for verification)
DROP POLICY IF EXISTS public_select_certificates ON certificates;
CREATE POLICY public_select_certificates ON certificates
  FOR SELECT TO anon
  USING (true);  -- Anyone can verify a certificate

-- CMS content: public can SELECT all published content
DROP POLICY IF EXISTS public_select_cms_content ON cms_content;
CREATE POLICY public_select_cms_content ON cms_content
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS public_select_cms_articles ON cms_articles;
CREATE POLICY public_select_cms_articles ON cms_articles
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_testimonials ON cms_testimonials;
CREATE POLICY public_select_cms_testimonials ON cms_testimonials
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_faq ON cms_faq;
CREATE POLICY public_select_cms_faq ON cms_faq
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_partners ON cms_partners;
CREATE POLICY public_select_cms_partners ON cms_partners
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_gallery ON cms_gallery;
CREATE POLICY public_select_cms_gallery ON cms_gallery
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_videos ON cms_videos;
CREATE POLICY public_select_cms_videos ON cms_videos
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_library ON cms_library;
CREATE POLICY public_select_cms_library ON cms_library
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_surveys ON cms_surveys;
CREATE POLICY public_select_cms_surveys ON cms_surveys
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS public_select_cms_rehabilitation ON cms_rehabilitation;
CREATE POLICY public_select_cms_rehabilitation ON cms_rehabilitation
  FOR SELECT TO anon
  USING (published = true);

-- Events: public can SELECT open events
DROP POLICY IF EXISTS public_select_events ON events;
CREATE POLICY public_select_events ON events
  FOR SELECT TO anon
  USING (status = 'open');

-- user_roles: public can SELECT (needed for client-side role checking)
-- This is already set in the schema, keep it.

-- ============================================================
-- 4. AUTHENTICATED USER POLICIES
-- ============================================================

-- NOTE: Volunteer self-read is handled by vol_select_own_volunteers below (with role check)
-- No broad 'any authenticated user can read volunteers' policy exists
-- Only super_admin and admin policies (above) and volunteer self-read (below) can access volunteers

-- ============================================================
-- 5. SUPER_ADMIN POLICIES (Full access to all tables)
-- ============================================================

DO $$ DECLARE
  tables TEXT[] := ARRAY[
    'volunteers', 'consultations', 'certificates', 'events', 'tasks',
    'teams', 'achievements', 'activity_log', 'points', 'notifications',
    'cms_content', 'cms_articles', 'cms_testimonials', 'cms_faq',
    'cms_partners', 'cms_gallery', 'cms_videos', 'cms_library',
    'cms_surveys', 'cms_rehabilitation', 'user_roles'
  ];
  t TEXT;
  policy_name TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    -- super_admin: ALL
    policy_name := 'super_admin_all_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (has_role(''super_admin'')) WITH CHECK (has_role(''super_admin''))',
      policy_name, t
    );
    -- admin: ALL (same as super_admin for most tables)
    policy_name := 'admin_all_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (has_role(''admin'')) WITH CHECK (has_role(''admin''))',
      policy_name, t
    );
  END LOOP;
END $$;

-- ============================================================
-- 6. PSYCHOLOGIST POLICIES (consultations only)
-- ============================================================

DROP POLICY IF EXISTS psych_select_consultations ON consultations;
CREATE POLICY psych_select_consultations ON consultations
  FOR SELECT TO authenticated
  USING (has_role('psychologist'));

DROP POLICY IF EXISTS psych_update_consultations ON consultations;
CREATE POLICY psych_update_consultations ON consultations
  FOR UPDATE TO authenticated
  USING (has_role('psychologist'))
  WITH CHECK (has_role('psychologist'));

-- ============================================================
-- 7. VOLUNTEER POLICIES (read own data, update own profile)
-- ============================================================

DROP POLICY IF EXISTS vol_select_own_volunteers ON volunteers;
CREATE POLICY vol_select_own_volunteers ON volunteers
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND auth.uid() IN (
      SELECT user_id FROM user_roles WHERE volunteer_id = volunteers.volunteer_id
    )
  );

DROP POLICY IF EXISTS vol_update_own_volunteers ON volunteers;
CREATE POLICY vol_update_own_volunteers ON volunteers
  FOR UPDATE TO authenticated
  USING (
    has_role('volunteer')
    AND auth.uid() IN (
      SELECT user_id FROM user_roles WHERE volunteer_id = volunteers.volunteer_id
    )
  )
  WITH CHECK (
    has_role('volunteer')
    AND auth.uid() IN (
      SELECT user_id FROM user_roles WHERE volunteer_id = volunteers.volunteer_id
    )
  );

-- ============================================================
-- 8. VERIFY AND SUMMARY
-- ============================================================

-- View to check all policies
CREATE OR REPLACE VIEW rls_policy_summary AS
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- MIGRATION SUMMARY
-- ============================================================
-- Old: 20 "anon_all" policies (full public access to all tables)
-- New:
--   - Public (anon): SELECT only on CMS/public tables
--   - super_admin: ALL on all 21 tables
--   - admin: ALL on all 21 tables
--   - psychologist: SELECT, UPDATE on consultations
--   - volunteer: SELECT own data, UPDATE own profile
--   - Public INSERT: volunteers (registration), consultations
--
-- ⚠️ AFTER RUNNING THIS:
-- Supabase Auth users with roles will be REQUIRED for write operations.
-- Anonymous users can still:
--   - Register as volunteers
--   - Submit consultations
--   - View published CMS content (articles, testimonials, FAQ, etc.)
--   - Verify certificates
-- ============================================================
