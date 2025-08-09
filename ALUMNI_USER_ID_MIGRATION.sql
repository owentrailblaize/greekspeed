-- Migration to add user_id field to alumni table and link to profiles
-- This enables connection functionality between active members and alumni

-- Add user_id column to alumni table
ALTER TABLE alumni ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Create an index for better performance
CREATE INDEX idx_alumni_user_id ON alumni(user_id);

-- Update existing alumni records to link to profiles based on email
-- This assumes that alumni emails match profile emails
UPDATE alumni 
SET user_id = profiles.id 
FROM profiles 
WHERE alumni.email = profiles.email;

-- Add a constraint to ensure user_id is unique (one profile per alumni)
ALTER TABLE alumni ADD CONSTRAINT unique_alumni_user_id UNIQUE (user_id);

-- Create a view to join alumni with profiles for easier querying
CREATE OR REPLACE VIEW alumni_with_profiles AS
SELECT 
  a.*,
  p.email as profile_email,
  p.full_name as profile_full_name,
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.chapter as profile_chapter,
  p.role as profile_role
FROM alumni a
LEFT JOIN profiles p ON a.user_id = p.id;

-- Add RLS policies for the alumni table
-- Allow users to view all alumni
CREATE POLICY "Allow users to view all alumni" ON alumni
  FOR SELECT USING (true);

-- Allow users to update their own alumni profile
CREATE POLICY "Allow users to update own alumni profile" ON alumni
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own alumni profile
CREATE POLICY "Allow users to insert own alumni profile" ON alumni
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY; 