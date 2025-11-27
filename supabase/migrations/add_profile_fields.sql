-- Migration: Add additional fields to profiles table
-- Run this in your Supabase SQL Editor if you want to store all setup form data

-- Add new columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT;

-- Add index on user_type for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);

-- Add comment to document the fields
COMMENT ON COLUMN profiles.user_type IS 'User role: Artist, Gallery, or Collector';
COMMENT ON COLUMN profiles.location IS 'User location (city, country)';
COMMENT ON COLUMN profiles.website IS 'User website URL';
COMMENT ON COLUMN profiles.bio IS 'User bio/description';
COMMENT ON COLUMN profiles.instagram IS 'Instagram handle';

