-- Add profile_visibility and slug fields to user_profiles table
-- Profile visibility controls what is visible on shared profile links

-- Add profile_visibility column (defaults to 'private' for MVP)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR(10) DEFAULT 'private';

-- Add constraint to ensure profile_visibility is either 'private' or 'public'
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS profile_visibility_check;

ALTER TABLE user_profiles 
ADD CONSTRAINT profile_visibility_check 
CHECK (profile_visibility IN ('private', 'public'));

-- Add slug column for profile URLs
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS slug VARCHAR(100);

-- Add index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_slug ON user_profiles(slug);

-- Add comment
COMMENT ON COLUMN user_profiles.profile_visibility IS 'Profile visibility setting: private (default) or public. Controls what is visible on shared profile links.';
COMMENT ON COLUMN user_profiles.slug IS 'URL-friendly identifier for profile sharing (e.g., used in https://www.aetherlabs.art/a/{slug})';

