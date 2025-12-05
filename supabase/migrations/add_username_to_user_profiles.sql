-- Add username field to user_profiles table
-- Username uniqueness is enforced at the application level, not via SQL constraint

-- Add column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- Drop existing unique constraint if it exists (we handle uniqueness in application code)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_username_key;

-- Drop existing format check constraint if it exists (we handle validation in application code)
ALTER TABLE user_profiles 
DROP CONSTRAINT IF EXISTS username_format_check;

-- Add index on username for faster lookups (still useful for queries)
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Add comment
COMMENT ON COLUMN user_profiles.username IS 'Username handle (Instagram-style, 1-30 characters, alphanumeric, underscores, dots). Uniqueness enforced at application level.';

