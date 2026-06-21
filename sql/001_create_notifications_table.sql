/* ============================================================
   SQL Migration: Create Notifications Table
   منصة وعي الشباب BBA - Dz Young Leaders
   Version: 1.0.0
   ============================================================ */

-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Recipient targeting
  recipient_id TEXT NOT NULL DEFAULT 'all',  -- user/volunteer ID or 'all' for broadcast
  recipient_role TEXT,                       -- 'volunteer', 'admin', 'psychologist', 'super_admin', or NULL for all

  -- Notification content
  type TEXT NOT NULL,                        -- event type: volunteer_approved, volunteer_rejected, certificate_issued, consultation_updated, announcement, role_changed, new_task, achievement_awarded
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  icon TEXT,                                 -- optional emoji override
  link TEXT,                                 -- optional deep link (e.g. 'portal.html', 'sidou-da.html#volunteers')

  -- Read tracking
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  -- Metadata (event-specific data as JSON)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Urgency
  is_urgent BOOLEAN NOT NULL DEFAULT FALSE,

  -- Sender info
  sender_id TEXT,
  sender_name TEXT
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_role ON public.notifications(recipient_role);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(recipient_id, read, created_at DESC);

-- Enable Row-Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to SELECT their own notifications (by recipient_id or recipient_role)
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  USING (
    recipient_id = current_setting('app.current_user_id', TRUE)
    OR recipient_id = 'all'
    OR recipient_role = current_setting('app.current_role', TRUE)
    OR current_setting('app.current_role', TRUE) = 'super_admin'
  );

-- Allow authenticated users to UPDATE read status on their own notifications
CREATE POLICY notifications_update_read ON public.notifications
  FOR UPDATE
  USING (
    recipient_id = current_setting('app.current_user_id', TRUE)
    OR current_setting('app.current_role', TRUE) = 'super_admin'
  )
  WITH CHECK (
    -- Only allow updating the read/read_at fields, not the content
    recipient_id = current_setting('app.current_user_id', TRUE)
    OR current_setting('app.current_role', TRUE) = 'super_admin'
  );

-- Allow super_admin and admin to INSERT notifications
CREATE POLICY notifications_insert_admin ON public.notifications
  FOR INSERT
  WITH CHECK (
    current_setting('app.current_role', TRUE) IN ('super_admin', 'admin')
  );

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- ============================================================
-- Helper function: Create a notification (safe, audited)
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_recipient_id TEXT,
  p_recipient_role TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_icon TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_is_urgent BOOLEAN DEFAULT FALSE,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_sender_id TEXT;
  v_sender_name TEXT;
BEGIN
  -- Get sender info from session variables
  v_sender_id := current_setting('app.current_user_id', TRUE);
  v_sender_name := current_setting('app.current_user_name', TRUE);

  INSERT INTO public.notifications (
    recipient_id, recipient_role, type, title, message,
    icon, link, is_urgent, metadata, sender_id, sender_name
  ) VALUES (
    p_recipient_id, p_recipient_role, p_type, p_title, p_message,
    COALESCE(p_icon, 
      CASE p_type
        WHEN 'volunteer_approved' THEN '✅'
        WHEN 'volunteer_rejected' THEN '❌'
        WHEN 'certificate_issued' THEN '📜'
        WHEN 'consultation_updated' THEN '💬'
        WHEN 'announcement' THEN '📢'
        WHEN 'role_changed' THEN '🔐'
        WHEN 'new_task' THEN '📋'
        WHEN 'achievement_awarded' THEN '🏆'
        ELSE 'ℹ️'
      END
    ),
    p_link, p_is_urgent, p_metadata,
    v_sender_id, v_sender_name
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper function: Get unread count for a recipient
-- ============================================================
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_recipient_id TEXT,
  p_recipient_role TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.notifications
  WHERE (recipient_id = p_recipient_id OR recipient_id = 'all' OR recipient_role = p_recipient_role)
    AND read = FALSE;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Trigger: auto-update updated_at on row modification
-- ============================================================
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
