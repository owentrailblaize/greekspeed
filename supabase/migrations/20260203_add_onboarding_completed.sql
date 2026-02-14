-- Add onboarding_completed column to profiles table
-- This tracks whether a user has completed the onboarding flow

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed 
ON profiles(onboarding_completed);

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether the user has completed the onboarding flow';
COMMENT ON COLUMN profiles.onboarding_completed_at IS 'Timestamp when the user completed onboarding';

-- Mark existing users with complete profiles as having completed onboarding
-- (to avoid forcing existing users through onboarding)
UPDATE profiles 
SET onboarding_completed = TRUE,
    onboarding_completed_at = NOW()
WHERE chapter IS NOT NULL 
  AND role IS NOT NULL
  AND onboarding_completed IS NULL;
