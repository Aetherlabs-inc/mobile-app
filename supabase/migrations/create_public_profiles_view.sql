-- Create a database view that only exposes public-safe columns
-- This provides database-level security by restricting which columns can be accessed

-- Drop view if it exists
DROP VIEW IF EXISTS public_profiles CASCADE;

-- Create view with only public-safe columns
-- Excludes: email, phone, instagram, website, updated_at, email_verified
CREATE VIEW public_profiles AS
SELECT 
  id,
  full_name,
  username,
  slug,
  avatar_url,
  user_type,
  bio,
  location,
  profile_visibility,
  created_at
FROM user_profiles
WHERE username IS NOT NULL OR slug IS NOT NULL;

-- Enable Row Level Security on the view
ALTER VIEW public_profiles SET (security_invoker = true);

-- Grant access to the view
-- In Supabase, authenticated and anon roles can access views
GRANT SELECT ON public_profiles TO anon, authenticated;

-- Create a comment explaining the view
COMMENT ON VIEW public_profiles IS 
  'Public profile view exposing only safe, non-sensitive information. Excludes email, phone, instagram, website, updated_at, and email_verified fields.';

