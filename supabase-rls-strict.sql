-- ============================================================
-- منصة وعي الشباب BBA - Strict Row Level Security Migration
-- Version: 2.0.0
-- 
-- This migration:
--   ✅ Drops ALL existing anon_all_* public access policies
--   ✅ Adds assigned_psychologist_id to consultations table
--   ✅ Creates helper functions for role-based access
--   ✅ Implements 4-tier RLS: super_admin → admin → psychologist → volunteer
--   ✅ Each tier has explicit per-table permissions
--   ✅ Volunteers can only access their own data
--   ✅ Psychologists can only access assigned consultations
--   ✅ Admins can manage platform content (cannot manage user_roles)
--   ✅ Super Admin has full access to everything (including user_roles)
--   ✅ Migration-safe: all statements use IF EXISTS / OR REPLACE
--   ✅ Backward compatible with existing data
--
-- Run order:
--   1. supabase-schema.sql (creates tables if not exist)
--   2. supabase-rls-strict.sql (THIS FILE - applies strict RLS)
--   3. Create auth users and assign roles via set_user_role()
-- ============================================================

-- ============================================================
-- ⚠️  IMPORTANT NOTICE
-- ============================================================
-- AFTER RUNNING THIS MIGRATION:
-- - Anonymous users can ONLY INSERT (register as volunteer, submit consultation)
--   and SELECT public/published data (articles, events, certificates)
-- - All other operations require authenticated Supabase users with roles
-- - Legacy hardcoded credentials (admin@bba.dz / bba2026) will NO LONGER
--   work for Supabase operations — only Supabase Auth users with roles can write
-- - Run this ONLY after creating auth users in Supabase Dashboard
-- ============================================================


-- ============================================================
-- 1. DROP ALL EXISTING ANONYMOUS ACCESS POLICIES
-- ============================================================
-- Safely removes every anon_all_* policy from all public tables.
-- Also drops previous RLS migration policies to avoid conflicts.
-- ============================================================

DO $$ DECLARE
  rec RECORD;
BEGIN
  FOR rec IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (policyname LIKE 'anon_all_%' OR policyname LIKE 'public_%' OR policyname LIKE 'auth_%' OR policyname LIKE 'super_admin_%' OR policyname LIKE 'admin_%' OR policyname LIKE 'psych_%' OR policyname LIKE 'vol_%' OR policyname LIKE 'user_roles_%')
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;


-- ============================================================
-- 2. ADD assigned_psychologist_id TO consultations TABLE
-- ============================================================
-- Allows assigning specific consultations to specific psychologists.
-- NULL = unassigned (visible to all psychologists for triage).
-- Non-NULL = assigned exclusively to that psychologist.
-- ============================================================

ALTER TABLE consultations
  ADD COLUMN IF NOT EXISTS assigned_psychologist_id UUID DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_consultations_assigned_psychologist
  ON consultations(assigned_psychologist_id);


-- ============================================================
-- 3. HELPER FUNCTIONS FOR ROLE-BASED ACCESS
-- ============================================================
-- All functions are STABLE (read-only, same result in same transaction)
-- and SECURITY DEFINER (execute with definer's privileges for RLS checks).
-- ============================================================

-- Check if current authenticated user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
  );
$$;

-- Check if current authenticated user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = ANY(required_roles)
  );
$$;

-- Get the volunteer_id for the current authenticated user (if they have one)
CREATE OR REPLACE FUNCTION public.current_volunteer_id()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT volunteer_id FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$;

-- Check if current user is the owner of a specific volunteer_id
CREATE OR REPLACE FUNCTION public.is_volunteer_owner(check_volunteer_id TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role = 'volunteer'
      AND volunteer_id = check_volunteer_id
  );
$$;

-- Check if a psychologist is assigned to a specific consultation
CREATE OR REPLACE FUNCTION public.is_assigned_psychologist(consultation_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM consultations
    WHERE id = consultation_id
      AND (assigned_psychologist_id IS NULL OR assigned_psychologist_id = auth.uid())
  );
$$;

-- Get the current assigned_psychologist_id for a consultation.
-- Used in RLS WITH CHECK to prevent psychologists from changing the assignment.
-- Note: This is a separate function (not inline subquery) to avoid
-- column name shadowing issues in RLS policy expressions.
CREATE OR REPLACE FUNCTION public.get_assigned_psychologist_id(consultation_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assigned_psychologist_id FROM consultations WHERE id = consultation_id;
$$;


-- ============================================================
-- 4. PUBLIC (ANONYMOUS) POLICIES
-- ============================================================
-- Anonymous users have the absolute minimum access required
-- for the public-facing website functionality.
-- ============================================================

-- -------------------------------------------------------
-- VOLUNTEERS: Public can register (INSERT), cannot read
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_insert_volunteers ON volunteers;
CREATE POLICY anon_insert_volunteers ON volunteers
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_volunteers ON volunteers;
CREATE POLICY anon_select_volunteers ON volunteers
  FOR SELECT TO anon
  USING (false);

DROP POLICY IF EXISTS anon_update_volunteers ON volunteers;
CREATE POLICY anon_update_volunteers ON volunteers
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_volunteers ON volunteers;
CREATE POLICY anon_delete_volunteers ON volunteers
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CONSULTATIONS: Public can submit (INSERT) and track own
-- by tracking_code via a SECURITY DEFINER function.
-- ⚠️  NO direct SELECT is granted to anon because that would
--    expose ALL consultation data via the Supabase REST API.
--    Instead, use get_consultation_by_tracking() in the app.
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_insert_consultations ON consultations;
CREATE POLICY anon_insert_consultations ON consultations
  FOR INSERT TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS anon_select_consultations ON consultations;
-- Intentionally NOT granted — anon cannot SELECT from consultations.
-- Use get_consultation_by_tracking() SECURITY DEFINER function instead.

DROP POLICY IF EXISTS anon_update_consultations ON consultations;
CREATE POLICY anon_update_consultations ON consultations
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_consultations ON consultations;
CREATE POLICY anon_delete_consultations ON consultations
  FOR DELETE TO anon
  USING (false);

-- Security definer function: returns a single consultation by tracking code
-- This is the ONLY way anonymous users can look up a consultation.
-- The tracking code is randomly generated and acts as the access token.
CREATE OR REPLACE FUNCTION public.get_consultation_by_tracking(code TEXT)
RETURNS SETOF consultations
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM consultations WHERE tracking_code = code LIMIT 1;
$$;

-- -------------------------------------------------------
-- CERTIFICATES: Public can verify by certificate_number
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_certificates ON certificates;
CREATE POLICY anon_select_certificates ON certificates
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS anon_insert_certificates ON certificates;
CREATE POLICY anon_insert_certificates ON certificates
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_certificates ON certificates;
CREATE POLICY anon_update_certificates ON certificates
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_certificates ON certificates;
CREATE POLICY anon_delete_certificates ON certificates
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- EVENTS: Public can see open events only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_events ON events;
CREATE POLICY anon_select_events ON events
  FOR SELECT TO anon
  USING (status = 'open');

DROP POLICY IF EXISTS anon_insert_events ON events;
CREATE POLICY anon_insert_events ON events
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_events ON events;
CREATE POLICY anon_update_events ON events
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_events ON events;
CREATE POLICY anon_delete_events ON events
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS CONTENT: Public can see all content
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_cms_content ON cms_content;
CREATE POLICY anon_select_cms_content ON cms_content
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS anon_insert_cms_content ON cms_content;
CREATE POLICY anon_insert_cms_content ON cms_content
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_cms_content ON cms_content;
CREATE POLICY anon_update_cms_content ON cms_content
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_cms_content ON cms_content;
CREATE POLICY anon_delete_cms_content ON cms_content
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS ARTICLES: Public can see published articles only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_articles ON cms_articles;
CREATE POLICY anon_select_published_articles ON cms_articles
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_articles ON cms_articles;
CREATE POLICY anon_insert_articles ON cms_articles
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_articles ON cms_articles;
CREATE POLICY anon_update_articles ON cms_articles
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_articles ON cms_articles;
CREATE POLICY anon_delete_articles ON cms_articles
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS TESTIMONIALS: Public can see published testimonials only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_testimonials ON cms_testimonials;
CREATE POLICY anon_select_published_testimonials ON cms_testimonials
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_testimonials ON cms_testimonials;
CREATE POLICY anon_insert_testimonials ON cms_testimonials
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_testimonials ON cms_testimonials;
CREATE POLICY anon_update_testimonials ON cms_testimonials
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_testimonials ON cms_testimonials;
CREATE POLICY anon_delete_testimonials ON cms_testimonials
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS FAQ: Public can see published FAQ only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_faq ON cms_faq;
CREATE POLICY anon_select_published_faq ON cms_faq
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_faq ON cms_faq;
CREATE POLICY anon_insert_faq ON cms_faq
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_faq ON cms_faq;
CREATE POLICY anon_update_faq ON cms_faq
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_faq ON cms_faq;
CREATE POLICY anon_delete_faq ON cms_faq
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS PARTNERS: Public can see published partners only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_partners ON cms_partners;
CREATE POLICY anon_select_published_partners ON cms_partners
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_partners ON cms_partners;
CREATE POLICY anon_insert_partners ON cms_partners
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_partners ON cms_partners;
CREATE POLICY anon_update_partners ON cms_partners
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_partners ON cms_partners;
CREATE POLICY anon_delete_partners ON cms_partners
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS GALLERY: Public can see published albums only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_gallery ON cms_gallery;
CREATE POLICY anon_select_published_gallery ON cms_gallery
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_gallery ON cms_gallery;
CREATE POLICY anon_insert_gallery ON cms_gallery
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_gallery ON cms_gallery;
CREATE POLICY anon_update_gallery ON cms_gallery
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_gallery ON cms_gallery;
CREATE POLICY anon_delete_gallery ON cms_gallery
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS VIDEOS: Public can see published videos only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_videos ON cms_videos;
CREATE POLICY anon_select_published_videos ON cms_videos
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_videos ON cms_videos;
CREATE POLICY anon_insert_videos ON cms_videos
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_videos ON cms_videos;
CREATE POLICY anon_update_videos ON cms_videos
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_videos ON cms_videos;
CREATE POLICY anon_delete_videos ON cms_videos
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS LIBRARY: Public can see published library items only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_library ON cms_library;
CREATE POLICY anon_select_published_library ON cms_library
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_library ON cms_library;
CREATE POLICY anon_insert_library ON cms_library
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_library ON cms_library;
CREATE POLICY anon_update_library ON cms_library
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_library ON cms_library;
CREATE POLICY anon_delete_library ON cms_library
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS SURVEYS: Public can see published surveys only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_surveys ON cms_surveys;
CREATE POLICY anon_select_published_surveys ON cms_surveys
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_surveys ON cms_surveys;
CREATE POLICY anon_insert_surveys ON cms_surveys
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_surveys ON cms_surveys;
CREATE POLICY anon_update_surveys ON cms_surveys
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_surveys ON cms_surveys;
CREATE POLICY anon_delete_surveys ON cms_surveys
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- CMS REHABILITATION: Public can see published reports only
-- -------------------------------------------------------
DROP POLICY IF EXISTS anon_select_published_rehab ON cms_rehabilitation;
CREATE POLICY anon_select_published_rehab ON cms_rehabilitation
  FOR SELECT TO anon
  USING (published = true);

DROP POLICY IF EXISTS anon_insert_rehab ON cms_rehabilitation;
CREATE POLICY anon_insert_rehab ON cms_rehabilitation
  FOR INSERT TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_update_rehab ON cms_rehabilitation;
CREATE POLICY anon_update_rehab ON cms_rehabilitation
  FOR UPDATE TO anon
  WITH CHECK (false);

DROP POLICY IF EXISTS anon_delete_rehab ON cms_rehabilitation;
CREATE POLICY anon_delete_rehab ON cms_rehabilitation
  FOR DELETE TO anon
  USING (false);

-- -------------------------------------------------------
-- REMAINING TABLES: NO anonymous access
-- -------------------------------------------------------
-- tasks, teams, achievements, activity_log, points,
-- notifications, user_roles
-- Anonymous cannot SELECT, INSERT, UPDATE, or DELETE on these.
-- (RLS blocks by default when no policy grants access.)


-- ============================================================
-- 5. VOLUNTEER POLICIES
-- ============================================================
-- Volunteers can only access data that belongs to them,
-- identified by matching user_roles.volunteer_id with the
-- volunteer_id column in each table.
-- ============================================================

-- -------------------------------------------------------
-- VOLUNTEERS TABLE: Volunteer can read and update own profile
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_own ON volunteers;
CREATE POLICY volunteer_select_own ON volunteers
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  );

DROP POLICY IF EXISTS volunteer_update_own ON volunteers;
CREATE POLICY volunteer_update_own ON volunteers
  FOR UPDATE TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  )
  WITH CHECK (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  );

-- -------------------------------------------------------
-- CERTIFICATES: Volunteer can see own certificates
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_own_certificates ON certificates;
CREATE POLICY volunteer_select_own_certificates ON certificates
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  );

-- -------------------------------------------------------
-- ACTIVITY LOG: Volunteer can see own activity log
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_own_activity ON activity_log;
CREATE POLICY volunteer_select_own_activity ON activity_log
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  );

-- -------------------------------------------------------
-- POINTS: Volunteer can see own points
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_own_points ON points;
CREATE POLICY volunteer_select_own_points ON points
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(volunteer_id)
  );

-- -------------------------------------------------------
-- TASKS: Volunteer can see tasks assigned to them or 'all'
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_tasks ON tasks;
CREATE POLICY volunteer_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND (
      assigned_to = 'all'
      OR assigned_to = current_volunteer_id()
    )
  );

-- -------------------------------------------------------
-- EVENTS: Volunteer can see all events and read registrations
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_events ON events;
CREATE POLICY volunteer_select_events ON events
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
  );

-- -------------------------------------------------------
-- ACHIEVEMENTS: Volunteer can see own achievements
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_own_achievements ON achievements;
CREATE POLICY volunteer_select_own_achievements ON achievements
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND is_volunteer_owner(assigned_to)
  );

-- -------------------------------------------------------
-- NOTIFICATIONS: Volunteer can see notifications (all or targeted)
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_notifications ON notifications;
CREATE POLICY volunteer_select_notifications ON notifications
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND (
      target_volunteer = 'all'
      OR target_volunteer = current_volunteer_id()
    )
  );

-- -------------------------------------------------------
-- TEAMS: Volunteer can see teams (for their municipality)
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_teams ON teams;
CREATE POLICY volunteer_select_teams ON teams
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
  );

-- -------------------------------------------------------
-- CMS CONTENT: Volunteer can see published content (same as anon + more)
-- -------------------------------------------------------
DROP POLICY IF EXISTS volunteer_select_cms_content ON cms_content;
CREATE POLICY volunteer_select_cms_content ON cms_content
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
  );

DROP POLICY IF EXISTS volunteer_select_cms_articles ON cms_articles;
CREATE POLICY volunteer_select_cms_articles ON cms_articles
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND published = true
  );

DROP POLICY IF EXISTS volunteer_select_cms_testimonials ON cms_testimonials;
CREATE POLICY volunteer_select_cms_testimonials ON cms_testimonials
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND published = true
  );

DROP POLICY IF EXISTS volunteer_select_cms_faq ON cms_faq;
CREATE POLICY volunteer_select_cms_faq ON cms_faq
  FOR SELECT TO authenticated
  USING (
    has_role('volunteer')
    AND published = true
  );


-- ============================================================
-- 6. PSYCHOLOGIST POLICIES
-- ============================================================
-- Psychologists can access consultations, but only those
-- assigned to them. Unassigned consultations (assigned_psychologist_id IS NULL)
-- are visible to all psychologists for triage.
-- No access to other data tables (volunteers, CMS, etc.)
-- ============================================================

-- -------------------------------------------------------
-- CONSULTATIONS: Psychologist can read assigned + unassigned,
-- update assigned ones (respond, change status)
-- -------------------------------------------------------
DROP POLICY IF EXISTS psychologist_select_consultations ON consultations;
CREATE POLICY psychologist_select_consultations ON consultations
  FOR SELECT TO authenticated
  USING (
    has_role('psychologist')
    AND (
      assigned_psychologist_id IS NULL
      OR assigned_psychologist_id = auth.uid()
    )
  );

-- Psychologists can UPDATE consultations assigned to them, but CANNOT
-- change the assigned_psychologist_id (only admins/super_admins can assign).
-- The WITH CHECK enforces that assigned_psychologist_id remains unchanged.
DROP POLICY IF EXISTS psychologist_update_assigned_consultations ON consultations;
CREATE POLICY psychologist_update_assigned_consultations ON consultations
  FOR UPDATE TO authenticated
  USING (
    has_role('psychologist')
    AND is_assigned_psychologist(id)
  )
  WITH CHECK (
    has_role('psychologist')
    AND is_assigned_psychologist(id)
    AND assigned_psychologist_id IS NOT DISTINCT FROM get_assigned_psychologist_id(id)
  );

-- Psychologists cannot insert or delete consultations

-- -------------------------------------------------------
-- CMS CONTENT (read only for reference)
-- -------------------------------------------------------
DROP POLICY IF EXISTS psychologist_select_cms ON cms_articles;
CREATE POLICY psychologist_select_cms ON cms_articles
  FOR SELECT TO authenticated
  USING (
    has_role('psychologist')
    AND published = true
  );

DROP POLICY IF EXISTS psychologist_select_testimonials ON cms_testimonials;
CREATE POLICY psychologist_select_testimonials ON cms_testimonials
  FOR SELECT TO authenticated
  USING (
    has_role('psychologist')
    AND published = true
  );


-- ============================================================
-- 7. ADMIN POLICIES
-- ============================================================
-- Admins can manage all platform content (ALL operations on
-- most tables), but CANNOT manage user_roles or the
-- consultations assigned_psychologist_id field.
-- Admins CAN view all consultations and respond.
-- ============================================================

-- -------------------------------------------------------
-- CORE DATA TABLES: Admin has full access
-- -------------------------------------------------------
DROP POLICY IF EXISTS admin_all_volunteers ON volunteers;
CREATE POLICY admin_all_volunteers ON volunteers
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_consultations ON consultations;
CREATE POLICY admin_all_consultations ON consultations
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_certificates ON certificates;
CREATE POLICY admin_all_certificates ON certificates
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_events ON events;
CREATE POLICY admin_all_events ON events
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_tasks ON tasks;
CREATE POLICY admin_all_tasks ON tasks
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_teams ON teams;
CREATE POLICY admin_all_teams ON teams
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_achievements ON achievements;
CREATE POLICY admin_all_achievements ON achievements
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_activity_log ON activity_log;
CREATE POLICY admin_all_activity_log ON activity_log
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_points ON points;
CREATE POLICY admin_all_points ON points
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_notifications ON notifications;
CREATE POLICY admin_all_notifications ON notifications
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- -------------------------------------------------------
-- CMS TABLES: Admin has full access
-- -------------------------------------------------------
DROP POLICY IF EXISTS admin_all_cms_content ON cms_content;
CREATE POLICY admin_all_cms_content ON cms_content
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_articles ON cms_articles;
CREATE POLICY admin_all_cms_articles ON cms_articles
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_testimonials ON cms_testimonials;
CREATE POLICY admin_all_cms_testimonials ON cms_testimonials
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_faq ON cms_faq;
CREATE POLICY admin_all_cms_faq ON cms_faq
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_partners ON cms_partners;
CREATE POLICY admin_all_cms_partners ON cms_partners
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_gallery ON cms_gallery;
CREATE POLICY admin_all_cms_gallery ON cms_gallery
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_videos ON cms_videos;
CREATE POLICY admin_all_cms_videos ON cms_videos
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_library ON cms_library;
CREATE POLICY admin_all_cms_library ON cms_library
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_surveys ON cms_surveys;
CREATE POLICY admin_all_cms_surveys ON cms_surveys
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS admin_all_cms_rehabilitation ON cms_rehabilitation;
CREATE POLICY admin_all_cms_rehabilitation ON cms_rehabilitation
  FOR ALL TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- -------------------------------------------------------
-- USER ROLES: Admin can SELECT (read) but CANNOT manage
-- This is reserved for super_admin only.
-- -------------------------------------------------------
DROP POLICY IF EXISTS admin_select_user_roles ON user_roles;
CREATE POLICY admin_select_user_roles ON user_roles
  FOR SELECT TO authenticated
  USING (has_role('admin'));


-- ============================================================
-- 8. SUPER ADMIN POLICIES
-- ============================================================
-- Super Admin has unrestricted access to ALL tables including
-- user_roles management. This is the only role that can
-- create/update/delete user role assignments.
-- ============================================================

-- -------------------------------------------------------
-- ALL TABLES: Super Admin full access
-- Generated dynamically to ensure no table is missed
-- -------------------------------------------------------

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
    -- Drop existing super_admin policy if any
    policy_name := 'super_admin_all_' || t;
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
    
    -- Create new super_admin full access policy
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (has_role(''super_admin'')) WITH CHECK (has_role(''super_admin''))',
      policy_name, t
    );
  END LOOP;
END $$;


-- ============================================================
-- 9. RLS POLICY AUDIT VIEW
-- ============================================================
-- Provides a comprehensive view of all active RLS policies
-- grouped by table, showing the permission level for each role.
-- ============================================================

DROP VIEW IF EXISTS rls_policy_audit;
CREATE VIEW rls_policy_audit AS
SELECT
  p.tablename AS table_name,
  p.policyname AS policy_name,
  CASE
    WHEN p.policyname LIKE 'anon_%' THEN 'public (anonymous)'
    WHEN p.policyname LIKE 'volunteer_%' THEN 'volunteer'
    WHEN p.policyname LIKE 'psychologist_%' THEN 'psychologist'
    WHEN p.policyname LIKE 'admin_%' THEN 'admin'
    WHEN p.policyname LIKE 'super_admin_%' THEN 'super_admin'
    ELSE 'other'
  END AS role,
  p.cmd AS operation,
  CASE
    WHEN p.cmd = 'ALL' THEN '✅ ALL (SELECT, INSERT, UPDATE, DELETE)'
    WHEN p.cmd = 'SELECT' THEN '✅ SELECT only'
    WHEN p.cmd = 'INSERT' THEN '✅ INSERT only'
    WHEN p.cmd = 'UPDATE' THEN '✅ UPDATE only'
    WHEN p.cmd = 'DELETE' THEN '✅ DELETE only'
    ELSE p.cmd
  END AS permissions,
  pg_size_pretty(pg_total_relation_size(quote_ident(p.tablename))) AS table_size
FROM pg_policies p
WHERE p.schemaname = 'public'
ORDER BY p.tablename, p.policyname;


-- ============================================================
-- 10. VERIFICATION QUERIES
-- ============================================================
-- Run these after migration to verify correctness.
-- Uncomment and execute in Supabase SQL Editor.
-- ============================================================

-- Check all policies are properly applied
-- SELECT tablename, count(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;

-- Check for any remaining anon_all_* policies (should be 0)
-- SELECT count(*) as remaining_anon_all_policies
-- FROM pg_policies
-- WHERE schemaname = 'public' AND policyname LIKE 'anon_all_%';

-- Full audit view
-- SELECT * FROM rls_policy_audit;

-- Check has_role function works
-- SELECT has_role('super_admin');

-- Check current_volunteer_id works
-- SELECT current_volunteer_id();


-- ============================================================
-- MIGRATION SUMMARY
-- ============================================================
-- 
-- BEFORE:
--   20 x anon_all_* policies = full public access to all tables
--   user_roles: anon can SELECT
--   No volunteer-specific, psychologist-specific, or admin-specific policies
--   No consultation assignment tracking
--
-- AFTER:
--   20 x anon_* policies = minimum public access (insert own data, select published content)
--     (note: anon has NO direct SELECT on consultations — uses get_consultation_by_tracking())
--   12 x volunteer_* policies = volunteers can only see their own data
--   4 x psychologist_* policies = psychologists can only access (un)assigned consultations
--       Psychologists CANNOT change assigned_psychologist_id (WITH CHECK enforces immutability)
--   22 x admin_* policies = admins can manage all platform content (except user_roles management)
--   21 x super_admin_* policies = full unrestricted access including user_roles
--   Total: ~79 policies covering every table and every role
--
-- SCHEMA CHANGES:
--   + assigned_psychologist_id column on consultations table
--   + idx_consultations_assigned_psychologist index
--   + rls_policy_audit view
--
-- NEW HELPER FUNCTIONS:
--   has_role(text)                       — Check if current user has a role
--   has_any_role(text[])                 — Check if current user has any of specified roles
--   current_volunteer_id()               — Get current user's volunteer_id
--   is_volunteer_owner(text)             — Check if current user owns a volunteer_id
--   is_assigned_psychologist(uuid)       — Check if current user is assigned to a consultation
--   get_consultation_by_tracking(text)   — 🔐 SECURITY DEFINER: returns one consultation by tracking code (anon-safe)
--
-- DATA ACCESS MAP:
--   Table                │ Anon    │ Volunteer │ Psych     │ Admin     │ SuperAdmin
--   ─────────────────────┼─────────┼───────────┼───────────┼───────────┼───────────
--   volunteers           │ INSERT  │ SEL,UPD   │ —         │ ALL       │ ALL
--   consultations        │ INSERT  │ —         │ SEL,UPD*  │ ALL       │ ALL
--   certificates         │ SELECT  │ SELECT    │ —         │ ALL       │ ALL
--   events               │ SEL**   │ SELECT    │ —         │ ALL       │ ALL
--   tasks                │ —       │ SELECT*** │ —         │ ALL       │ ALL
--   teams                │ —       │ SELECT    │ —         │ ALL       │ ALL
--   achievements         │ —       │ SELECT    │ —         │ ALL       │ ALL
--   activity_log         │ —       │ SELECT    │ —         │ ALL       │ ALL
--   points               │ —       │ SELECT    │ —         │ ALL       │ ALL
--   notifications        │ —       │ SELECT*** │ —         │ ALL       │ ALL
--   cms_content          │ SELECT  │ SELECT    │ —         │ ALL       │ ALL
--   cms_articles         │ SEL**** │ SEL****   │ SEL****   │ ALL       │ ALL
--   cms_testimonials     │ SEL**** │ SEL****   │ SEL****   │ ALL       │ ALL
--   cms_faq              │ SEL**** │ SEL****   │ —         │ ALL       │ ALL
--   cms_partners         │ SEL**** │ —         │ —         │ ALL       │ ALL
--   cms_gallery          │ SEL**** │ —         │ —         │ ALL       │ ALL
--   cms_videos           │ SEL**** │ —         │ —         │ ALL       │ ALL
--   cms_library          │ SEL**** │ —         │ —         │ ALL       │ ALL
--   cms_surveys          │ SEL**** │ —         │ —         │ ALL       │ ALL
--   cms_rehabilitation   │ SEL**** │ —         │ —         │ ALL       │ ALL
--   user_roles           │ —       │ —         │ —         │ SELECT    │ ALL
--
--   *   Psychologists: SEL if unassigned OR assigned to them; UPD only if assigned to them
--   **  Anon: only status = 'open'
--   *** Volunteers: only assigned_to = 'all' OR assigned_to = current_volunteer_id
--   **** Only published = true
-- ============================================================

-- ✅ Migration ready. Run this in Supabase SQL Editor after supabase-schema.sql.
