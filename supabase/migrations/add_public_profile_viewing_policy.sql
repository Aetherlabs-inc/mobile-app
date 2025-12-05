-- Database-level security for public profile viewing
-- This migration implements multiple layers of database-level protection

-- ============================================================================
-- PART 1: Restrict direct table access
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own user_profile" ON user_profiles;
DROP POLICY IF EXISTS "Public can view profiles by username or slug" ON user_profiles;

-- Policy 1: Users can view their own complete profile (full access)
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

-- Policy 2: Remove public access to the base table
-- Public users should ONLY access profiles through the public_profiles view
-- This ensures sensitive columns (email, phone, etc.) are never accessible
-- Note: We don't create a public policy on user_profiles table itself

-- ============================================================================
-- PART 2: Create secure database function for public profile lookup
-- ============================================================================

-- Drop function if exists
DROP FUNCTION IF EXISTS get_public_profile_by_username_or_slug(TEXT);

-- Create a SECURITY DEFINER function that returns only public-safe columns
-- This function can be called by anyone (anon role) but only returns safe data
CREATE OR REPLACE FUNCTION get_public_profile_by_username_or_slug(identifier TEXT)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR,
  username VARCHAR,
  slug VARCHAR,
  avatar_url TEXT,
  user_type VARCHAR,
  bio TEXT,
  location VARCHAR,
  profile_visibility VARCHAR,
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.full_name,
    up.username,
    up.slug,
    up.avatar_url,
    up.user_type,
    up.bio,
    up.location,
    up.profile_visibility,
    up.created_at
  FROM user_profiles up
  WHERE (up.username = LOWER(identifier) OR up.slug = LOWER(identifier))
    AND (up.username IS NOT NULL OR up.slug IS NOT NULL)
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_public_profile_by_username_or_slug(TEXT) TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION get_public_profile_by_username_or_slug IS 
  'Returns public-safe profile data by username or slug. Excludes sensitive fields: email, phone, instagram, website, updated_at, email_verified.';

-- ============================================================================
-- PART 3: Create RLS policies for the public_profiles view
-- ============================================================================

-- Note: The public_profiles view is created in create_public_profiles_view.sql
-- We need to ensure RLS is enabled and policies are set

-- Enable RLS on the view (if supported)
-- Note: Views in PostgreSQL don't support RLS directly, but we can use the underlying table's RLS
-- The view automatically inherits security from the base table

-- ============================================================================
-- SECURITY SUMMARY
-- ============================================================================

-- Database-level protections implemented:
-- 1. Base table (user_profiles): Only accessible by the profile owner
-- 2. Public view (public_profiles): Only exposes public-safe columns
-- 3. Secure function (get_public_profile_by_username_or_slug): Returns only safe data
--
-- Sensitive fields NEVER exposed:
-- - email (private contact information)
-- - phone (private contact information)  
-- - instagram (excluded for MVP privacy)
-- - website (excluded for MVP privacy)
-- - updated_at (internal metadata)
-- - email_verified (internal account status)
--
-- Usage:
-- - For public access: SELECT * FROM public_profiles WHERE username = '...' OR slug = '...'
-- - Or use function: SELECT * FROM get_public_profile_by_username_or_slug('identifier')
-- - For own profile: SELECT * FROM user_profiles WHERE id = auth.uid()

