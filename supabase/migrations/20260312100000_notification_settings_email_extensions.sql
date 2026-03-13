-- Add email preference columns for post comment, comment reply, post like, comment like, and inactivity reminder.
-- Default true (opt-in) to match existing notification_settings behavior.
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS post_comment_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_reply_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS post_like_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS comment_like_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS inactivity_reminder_notifications boolean NOT NULL DEFAULT true;
