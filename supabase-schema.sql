-- ============================================================
-- منصة وعي الشباب BBA - Dz Young Leaders
-- Complete Supabase Database Schema
-- Run this entire file in the Supabase SQL Editor
-- Project URL: https://ouyqcyrbppkxvcknxtbn.supabase.co
-- ============================================================
-- Generated: June 2026
-- Instructions: Open Supabase Dashboard → SQL Editor →
--   New Query → Paste → Run
-- ============================================================

-- ============================================================
-- 1. VOLUNTEERS
-- Stores all volunteer registrations from the public form
-- and admin-managed data (status, membership, points, notes).
-- localStorage key: bba_volunteers
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  municipality TEXT NOT NULL,
  membership_type TEXT NOT NULL DEFAULT 'member',
  motivation TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  suspended BOOLEAN DEFAULT false,
  volunteer_id TEXT UNIQUE,
  admin_notes TEXT DEFAULT '',
  participation_history JSONB DEFAULT '[]',
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteers_volunteer_id ON volunteers(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteers_status ON volunteers(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_municipality ON volunteers(municipality);
CREATE INDEX IF NOT EXISTS idx_volunteers_email ON volunteers(email);

-- ============================================================
-- 2. CONSULTATIONS
-- Anonymous consultation requests from the public form.
-- Psychologists respond via specialist_response field.
-- This table doubles as the psychologist replies system.
-- localStorage key: bba_consultations
-- ============================================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_code TEXT UNIQUE NOT NULL,
  alias TEXT NOT NULL,
  age_group TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  specialist_response TEXT DEFAULT '',
  extra_notes TEXT DEFAULT '',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultations_tracking_code ON consultations(tracking_code);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date);

-- ============================================================
-- 3. CERTIFICATES
-- Certificates of appreciation issued to volunteers.
-- Uses unique certificate numbers (CERT-BBA-2026-XXXX).
-- localStorage key: bba_certificates
-- ============================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  volunteer_id TEXT NOT NULL,
  volunteer_name TEXT DEFAULT '',
  certificate_number TEXT UNIQUE NOT NULL,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_volunteer_id ON certificates(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);

-- ============================================================
-- 4. EVENTS
-- Public events and activities managed by admins.
-- Supports registration tracking and attendance marking.
-- localStorage key: bba_events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  type_icon TEXT DEFAULT '📅',
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  date DATE NOT NULL,
  location TEXT DEFAULT '',
  municipality TEXT DEFAULT '',
  seats INTEGER DEFAULT 0,
  target_audience TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',
  registrations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_municipality ON events(municipality);

-- ============================================================
-- 5. TASKS
-- Tasks assigned to volunteers or teams by admins.
-- Contains priority levels and deadlines.
-- localStorage key: bba_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  assigned_to TEXT NOT NULL DEFAULT 'all',
  priority TEXT NOT NULL DEFAULT 'medium',
  deadline TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- ============================================================
-- 6. TEAMS (Municipality Teams)
-- Teams organized by municipality with leaders and members.
-- localStorage key: bba_teams
-- ============================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  leader_id TEXT DEFAULT '',
  members JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_municipality ON teams(municipality);

-- ============================================================
-- 7. ACHIEVEMENTS
-- Badges and achievements awarded to volunteers.
-- localStorage key: bba_achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT DEFAULT '🏆',
  assigned_to TEXT NOT NULL,
  date_awarded TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_assigned_to ON achievements(assigned_to);

-- ============================================================
-- 8. ACTIVITY LOG
-- Log of volunteer activities with point awards.
-- localStorage key: bba_activity_log
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  points INTEGER DEFAULT 0,
  date DATE,
  volunteer_id TEXT NOT NULL,
  volunteer_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_volunteer_id ON activity_log(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(date);

-- ============================================================
-- 9. POINTS
-- Per-volunteer points history (additions and deductions).
-- Each row is a single event (earn 10 pts, spend 20 pts, etc.).
-- localStorage key: bba_points_<volunteerId>
-- ============================================================
CREATE TABLE IF NOT EXISTS points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  volunteer_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'add',
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_volunteer_id ON points(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_points_type ON points(type);

-- ============================================================
-- 10. NOTIFICATIONS
-- Notifications sent to volunteers by admins.
-- Can target all volunteers or specific individuals.
-- localStorage key: bba_notifications_data
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  target_volunteer TEXT NOT NULL DEFAULT 'all',
  is_urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target_volunteer);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================
-- 11. CMS CONTENT (Generic Key-Value Store)
-- Stores CMS items that are single objects:
--   hero, notice_bar, achievements_page
-- Uses JSONB for flexible data storage.
-- localStorage key: bba_cms_<content_key>
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_key TEXT UNIQUE NOT NULL,
  content_data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_content_key ON cms_content(content_key);

-- ============================================================
-- 12. CMS - ARTICLES
-- Awareness articles with full HTML content,
-- categories, and publishing controls.
-- localStorage key: bba_cms_articles
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'توعية',
  image TEXT DEFAULT '',
  reading_time INTEGER DEFAULT 5,
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  published BOOLEAN DEFAULT true,
  pinned BOOLEAN DEFAULT false,
  date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_articles_published ON cms_articles(published);
CREATE INDEX IF NOT EXISTS idx_cms_articles_category ON cms_articles(category);

-- ============================================================
-- 13. CMS - TESTIMONIALS
-- Volunteer and beneficiary testimonials.
-- localStorage key: bba_cms_testimonials
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  role TEXT DEFAULT '',
  avatar TEXT DEFAULT '⭐',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_testimonials_published ON cms_testimonials(published);

-- ============================================================
-- 14. CMS - FAQ
-- Frequently asked questions and answers.
-- localStorage key: bba_cms_faq
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_faq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_faq_published ON cms_faq(published);

-- ============================================================
-- 15. CMS - PARTNERS
-- Partner organizations, sponsors, and collaborators.
-- localStorage key: bba_cms_partners
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT DEFAULT '',
  website TEXT DEFAULT '',
  category TEXT DEFAULT '',
  contact_info TEXT DEFAULT '',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_partners_category ON cms_partners(category);

-- ============================================================
-- 16. CMS - GALLERY (Albums)
-- Photo albums with multiple images stored as JSONB array.
-- localStorage key: bba_cms_gallery
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  images JSONB DEFAULT '[]',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. CMS - VIDEOS
-- Educational and promotional videos (YouTube links).
-- localStorage key: bba_cms_videos
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  category TEXT DEFAULT 'توعوية',
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_videos_category ON cms_videos(category);

-- ============================================================
-- 18. CMS - LIBRARY (Digital Documents)
-- Document downloads (PDFs, reports, guides).
-- localStorage key: bba_cms_library
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'PDF',
  category TEXT DEFAULT '',
  downloads INTEGER DEFAULT 0,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_library_type ON cms_library(type);

-- ============================================================
-- 19. CMS - SURVEYS
-- Community surveys with questions and collected responses.
-- localStorage key: bba_cms_surveys
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  questions JSONB DEFAULT '[]',
  responses JSONB DEFAULT '[]',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 20. CMS - REHABILITATION (Prisoner Program)
-- Reports and updates on the prisoner rehabilitation program.
-- Organized by stage (awareness → psychological → vocational → post-release).
-- localStorage key: bba_cms_rehabilitation
-- ============================================================
CREATE TABLE IF NOT EXISTS cms_rehabilitation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  doc_url TEXT DEFAULT '',
  type TEXT DEFAULT 'تقرير',
  stage TEXT DEFAULT '',
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_rehabilitation_stage ON cms_rehabilitation(stage);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- All tables get RLS for future auth integration.
-- Currently set to allow anonymous all-access (matching the
-- localStorage-only behavior). Restrict these in production.
-- ============================================================
ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE points ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE cms_rehabilitation ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES: Anonymous Full Access
-- These policies mirror the current app behavior where anyone
-- can read/write data (previously localStorage was fully open).
--
-- ⚠️ PRODUCTION WARNING:
-- Replace these with proper auth-based policies before going live.
-- Example for authenticated-only:
--   CREATE POLICY auth_all_volunteers ON volunteers
--     FOR ALL USING (auth.role() = 'authenticated')
--     WITH CHECK (auth.role() = 'authenticated');
-- ============================================================

DROP POLICY IF EXISTS anon_all_volunteers ON volunteers;
CREATE POLICY anon_all_volunteers ON volunteers
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_consultations ON consultations;
CREATE POLICY anon_all_consultations ON consultations
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_certificates ON certificates;
CREATE POLICY anon_all_certificates ON certificates
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_events ON events;
CREATE POLICY anon_all_events ON events
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_tasks ON tasks;
CREATE POLICY anon_all_tasks ON tasks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_teams ON teams;
CREATE POLICY anon_all_teams ON teams
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_achievements ON achievements;
CREATE POLICY anon_all_achievements ON achievements
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_activity_log ON activity_log;
CREATE POLICY anon_all_activity_log ON activity_log
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_points ON points;
CREATE POLICY anon_all_points ON points
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_notifications ON notifications;
CREATE POLICY anon_all_notifications ON notifications
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_content ON cms_content;
CREATE POLICY anon_all_cms_content ON cms_content
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_articles ON cms_articles;
CREATE POLICY anon_all_cms_articles ON cms_articles
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_testimonials ON cms_testimonials;
CREATE POLICY anon_all_cms_testimonials ON cms_testimonials
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_faq ON cms_faq;
CREATE POLICY anon_all_cms_faq ON cms_faq
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_partners ON cms_partners;
CREATE POLICY anon_all_cms_partners ON cms_partners
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_gallery ON cms_gallery;
CREATE POLICY anon_all_cms_gallery ON cms_gallery
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_videos ON cms_videos;
CREATE POLICY anon_all_cms_videos ON cms_videos
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_library ON cms_library;
CREATE POLICY anon_all_cms_library ON cms_library
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_surveys ON cms_surveys;
CREATE POLICY anon_all_cms_surveys ON cms_surveys
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS anon_all_cms_rehabilitation ON cms_rehabilitation;
CREATE POLICY anon_all_cms_rehabilitation ON cms_rehabilitation
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- SUMMARY
-- Total tables: 20
-- Total indexes: 30
-- Total RLS policies: 20 (one per table)
--
-- Table overview:
--   1.  volunteers       — Volunteer registrations and profiles
--   2.  consultations    — Consultation requests + psychologist replies
--   3.  certificates     — Volunteer certificates of appreciation
--   4.  events           — Public events with registration
--   5.  tasks            — Admin-assigned tasks for volunteers
--   6.  teams            — Municipality-based volunteer teams
--   7.  achievements     — Badges and awards for volunteers
--   8.  activity_log     — Volunteer activity tracking with points
--   9.  points           — Per-volunteer points history
--   10. notifications    — Admin-sent notifications to volunteers
--   11. cms_content      — Generic CMS key-value store (hero, notice_bar)
--   12. cms_articles     — Awareness articles with HTML content
--   13. cms_testimonials — Volunteer/beneficiary testimonials
--   14. cms_faq          — Frequently asked questions
--   15. cms_partners     — Partner organizations
--   16. cms_gallery      — Photo albums
--   17. cms_videos       — Educational video library
--   18. cms_library      — Digital document downloads
--   19. cms_surveys      — Community surveys
--   20. cms_rehabilitation — Prisoner rehabilitation program reports
-- ============================================================

-- ============================================================
-- 21. USER ROLES (Supabase Auth Integration)
-- Links auth.users table to application roles.
-- Roles: super_admin, admin, psychologist, volunteer
-- Create users first in Supabase Auth UI, then insert rows here.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'psychologist', 'volunteer')),
  volunteer_id TEXT DEFAULT NULL,
  display_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Allow anon to read roles (for dashboard guarding from client side)
DROP POLICY IF EXISTS user_roles_select_all ON user_roles;
CREATE POLICY user_roles_select_all ON user_roles
  FOR SELECT USING (true);

-- ============================================================
-- HELPER FUNCTION: get_user_role(uid)
-- Returns the role string for a given auth user ID.
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_role(uid UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
AS $$
  SELECT role FROM user_roles WHERE user_id = uid LIMIT 1;
$$;

-- ============================================================
-- HELPER FUNCTION: set_user_role()
-- Creates or updates a user's role assignment.
-- ============================================================
CREATE OR REPLACE FUNCTION set_user_role(
  p_user_id UUID,
  p_role TEXT,
  p_volunteer_id TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_roles (user_id, role, volunteer_id, display_name)
  VALUES (p_user_id, p_role, p_volunteer_id, p_display_name)
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    volunteer_id = EXCLUDED.volunteer_id,
    display_name = EXCLUDED.display_name,
    updated_at = NOW();
END;
$$;

-- ============================================================
-- SEED INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Create users with these credentials:
--    - admin@bba.dz / bba2026 (super_admin)
--    - admin2@bba.dz / bba2026 (admin)
--    - psychologist@bba.dz / bba2026 (psychologist)
--    - volunteer@bba.dz / bba2026 (volunteer)
-- 3. Get each user's UUID from the users list
-- 4. Run: SELECT set_user_role('USER_UUID', 'super_admin');
--    (Repeat for each role)
-- ============================================================

-- ============================================================
-- SUMMARY (Updated)
-- Total tables: 21
-- Total indexes: 33
-- Total functions: 2
-- ============================================================

-- ✅ Schema ready. Run this in your Supabase SQL Editor.
