-- ============================================================
-- منصة وعي الشباب BBA - Dz Young Leaders
-- Super Admin Seed Script
-- ============================================================
-- Instructions:
-- 1. Go to Supabase Dashboard → Authentication → Users → Add User
-- 2. Create this user:
--    Email: admin@bba.dz
--    Password: bba2026
--    Auto-confirm email: YES (toggle on)
-- 3. Copy the User UUID from the users table
-- 4. Replace 'USER_UUID_HERE' below with that UUID
-- 5. Run this script in the SQL Editor
-- ============================================================

-- Assign Super Admin role
SELECT set_user_role(
  p_user_id      := 'USER_UUID_HERE',   -- ← REPLACE THIS
  p_role         := 'super_admin',
  p_volunteer_id := NULL,
  p_display_name := 'مدير النظام'
);

-- Verify the assignment
SELECT u.email, ur.role, ur.display_name, ur.created_at
FROM auth.users u
JOIN user_roles ur ON ur.user_id = u.id
WHERE u.email = 'admin@bba.dz';

-- ============================================================
-- Additional roles (optional — run after creating each user):
-- ============================================================
-- SELECT set_user_role('USER_UUID', 'admin',         NULL,  'مساعد');
-- SELECT set_user_role('USER_UUID', 'psychologist',  NULL,  'مستشار نفسي');
-- SELECT set_user_role('USER_UUID', 'volunteer',     'VOL-BBA-2026-0001',  'متطوع');
-- ============================================================
-- Done. You can now log in at admin.html with admin@bba.dz / bba2026
-- ============================================================
