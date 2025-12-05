-- Query Examples for Public Profiles
-- These examples show how to correctly query public profile data

-- ============================================================================
-- CORRECT: Query public_profiles view (only public-safe columns)
-- ============================================================================

-- Get profile by username
SELECT * FROM public_profiles WHERE username = 'rashodk';

-- Get profile by slug
SELECT * FROM public_profiles WHERE slug = 'rashodk-slug';

-- Get specific public columns
SELECT 
  id, 
  full_name, 
  username, 
  avatar_url, 
  bio, 
  location 
FROM public_profiles 
WHERE username = 'rashodk';

-- ============================================================================
-- CORRECT: Use the secure function
-- ============================================================================

-- Get profile using the secure function
SELECT * FROM get_public_profile_by_username_or_slug('rashodk');

-- ============================================================================
-- INCORRECT: These will fail (as expected for security)
-- ============================================================================

-- ❌ This will fail - email doesn't exist in the view
-- SELECT email FROM public_profiles WHERE username = 'rashodk';
-- ERROR: column "email" does not exist

-- ❌ This will fail - phone doesn't exist in the view
-- SELECT phone FROM public_profiles WHERE username = 'rashodk';
-- ERROR: column "phone" does not exist

-- ❌ This will fail - instagram doesn't exist in the view
-- SELECT instagram FROM public_profiles WHERE username = 'rashodk';
-- ERROR: column "instagram" does not exist

-- ============================================================================
-- For accessing your own profile (with all fields including email)
-- ============================================================================

-- As authenticated user, query the base table for your own profile
SELECT * FROM user_profiles WHERE id = auth.uid();

-- This works because RLS allows you to view your own profile
-- You'll get all fields including email, phone, etc.

-- ============================================================================
-- Summary
-- ============================================================================

-- ✅ Use public_profiles view for public profile viewing
-- ✅ Use get_public_profile_by_username_or_slug() function
-- ✅ Use user_profiles table (with auth.uid()) for your own profile
-- ❌ Don't try to access email, phone, etc. from public_profiles view
-- ❌ Don't try to access user_profiles table without authentication

