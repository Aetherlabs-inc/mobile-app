import { supabase } from './supabase';
import { User, ProfileVisibility, PublicProfile } from '@/types';

/**
 * Validate username format (Instagram-style)
 * - 1-30 characters
 * - Alphanumeric, underscores, and dots only
 * - Cannot start or end with a dot
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 1 || trimmed.length > 30) {
    return { valid: false, error: 'Username must be between 1 and 30 characters' };
  }

  if (!/^[a-zA-Z0-9._]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and dots' };
  }

  if (trimmed.startsWith('.') || trimmed.endsWith('.')) {
    return { valid: false, error: 'Username cannot start or end with a dot' };
  }

  if (trimmed.includes('..')) {
    return { valid: false, error: 'Username cannot contain consecutive dots' };
  }

  return { valid: true };
}

/**
 * Check if username is available
 */
export async function checkUsernameAvailability(username: string, excludeUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('user_profiles')
      .select('id')
      .eq('username', username.toLowerCase());

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking username availability:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Update user profile
 * Performs server-side validation including username uniqueness check
 */
export async function updateProfile(
  userId: string,
  updates: Partial<User>
): Promise<User> {
  // Normalize user_type to ensure it matches the constraint (lowercase: artist, gallery, collector)
  const normalizedUpdates = { ...updates };
  if (normalizedUpdates.user_type) {
    // Ensure user_type is lowercase to match database constraint
    normalizedUpdates.user_type = normalizedUpdates.user_type.toLowerCase();
  }

  // Normalize username to lowercase and validate
  if (normalizedUpdates.username !== undefined) {
    const trimmedUsername = normalizedUpdates.username.trim().toLowerCase();

    // Validate username format
    const validation = validateUsername(trimmedUsername);
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid username format');
    }

    // Check username uniqueness (server-side check)
    // Only check if username is being changed
    const { data: currentProfile } = await supabase
      .from('user_profiles')
      .select('username')
      .eq('id', userId)
      .single();

    const isChangingUsername = currentProfile?.username?.toLowerCase() !== trimmedUsername;

    if (isChangingUsername) {
      const isAvailable = await checkUsernameAvailability(trimmedUsername, userId);
      if (!isAvailable) {
        throw new Error('Username is already taken. Please choose another one.');
      }
    }

    normalizedUpdates.username = trimmedUsername;
  }

  // Update profile in database
  let { data, error } = await supabase
    .from('user_profiles')
    .update(normalizedUpdates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    throw error;
  }

  return data;
}

/**
 * Generate a URL-friendly slug from a string
 */
function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

/**
 * Check if slug is available
 */
async function checkSlugAvailability(slug: string, excludeUserId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('user_profiles')
      .select('id')
      .eq('slug', slug);

    if (excludeUserId) {
      query = query.neq('id', excludeUserId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error checking slug availability:', error);
      return false;
    }

    return !data || data.length === 0;
  } catch (error) {
    console.error('Error checking slug availability:', error);
    return false;
  }
}

/**
 * Generate and ensure a unique slug exists for a user
 * Uses username if available, otherwise falls back to full_name
 */
export async function ensureUserSlug(user: User): Promise<string> {
  // If slug already exists, return it
  if (user.slug) {
    return user.slug;
  }

  // Generate slug from username or full_name
  const baseSlug = user.username
    ? generateSlug(user.username)
    : generateSlug(user.full_name || `user-${user.id.substring(0, 8)}`);

  let slug = baseSlug;
  let counter = 1;

  // Ensure uniqueness
  while (!(await checkSlugAvailability(slug, user.id))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // Save the slug to the profile
  try {
    await updateProfile(user.id, { slug });
  } catch (error) {
    console.error('Error saving slug:', error);
    // Continue anyway - we'll return the generated slug
  }

  return slug;
}

/**
 * Get shareable profile URL
 */
export async function getProfileShareUrl(user: User): Promise<string> {
  const slug = await ensureUserSlug(user);
  return `https://www.aetherlabs.art/a/${slug}`;
}

/**
 * Update profile visibility
 */
export async function updateProfileVisibility(
  userId: string,
  visibility: ProfileVisibility
): Promise<User> {
  return updateProfile(userId, { profile_visibility: visibility });
}

/**
 * Sanitize a User profile to PublicProfile (removes sensitive information)
 * Only includes fields safe for public viewing
 */
export function sanitizeProfileForPublic(user: User): PublicProfile {
  return {
    id: user.id,
    full_name: user.full_name,
    username: user.username,
    slug: user.slug,
    avatar_url: user.avatar_url,
    user_type: user.user_type,
    bio: user.bio,
    location: user.location,
    profile_visibility: user.profile_visibility,
    created_at: user.created_at,
    // Explicitly exclude: email, phone, instagram, website, email_verified, updated_at
  };
}

/**
 * Get public profile by username or slug (for public profile viewing)
 * Returns only safe, non-sensitive information
 * Uses database view for database-level security
 * This function is used for profile sharing via URLs
 */
export async function getPublicProfileByUsernameOrSlug(identifier: string): Promise<PublicProfile | null> {
  try {
    // OPTION 1: Use the database view (recommended - enforces database-level restrictions)
    // The view only exposes public-safe columns, providing security at the database level
    let { data, error } = await supabase
      .from('public_profiles')
      .select('*')
      .or(`username.eq.${identifier.toLowerCase()},slug.eq.${identifier.toLowerCase()}`)
      .single();

    // OPTION 2: Use the database function (alternative approach)
    // If view doesn't work, fall back to using the secure function
    if (error || !data) {
      const { data: functionData, error: functionError } = await supabase
        .rpc('get_public_profile_by_username_or_slug', { identifier: identifier.toLowerCase() });

      if (!functionError && functionData && functionData.length > 0) {
        data = functionData[0];
        error = null;
      }
    }

    // OPTION 3: Fallback to direct query with explicit column selection (last resort)
    // This should not be necessary if view/function are set up correctly
    if (error || !data) {
      console.warn('View/function not available, falling back to direct query with column selection');
      const publicFields = 'id, full_name, username, slug, avatar_url, user_type, bio, location, profile_visibility, created_at';
      
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_profiles')
        .select(publicFields)
        .or(`username.eq.${identifier.toLowerCase()},slug.eq.${identifier.toLowerCase()}`)
        .single();

      if (!fallbackError && fallbackData) {
        data = fallbackData;
        error = null;
      }
    }

    if (error || !data) {
      console.log('Profile not found for identifier:', identifier);
      return null;
    }

    // Sanitize the data (extra safety check - should already be safe from view/function)
    return sanitizeProfileForPublic(data as User);
  } catch (error) {
    console.error('Error fetching public profile by username/slug:', error);
    return null;
  }
}

/**
 * Get user profile by username or slug (for authenticated users only)
 * Returns full profile data including sensitive information
 * Use getPublicProfileByUsernameOrSlug for public viewing
 */
export async function getProfileByUsernameOrSlug(identifier: string): Promise<User | null> {
  try {
    // Try to find by username first (case-insensitive)
    let { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('username', identifier.toLowerCase())
      .single();

    // If not found by username, try slug
    if (error || !data) {
      const { data: slugData, error: slugError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('slug', identifier.toLowerCase())
        .single();

      if (!slugError && slugData) {
        data = slugData;
        error = null;
      }
    }

    if (error || !data) {
      console.log('Profile not found for identifier:', identifier);
      return null;
    }

    return data as User;
  } catch (error) {
    console.error('Error fetching profile by username/slug:', error);
    return null;
  }
}

/**
 * Get user statistics (for authenticated users)
 */
export async function getUserStatistics(userId: string): Promise<{
  artworks: number;
  certificates: number;
  collections: number;
}> {
  try {
    // Get artworks count
    const { count: artworksCount } = await supabase
      .from('artworks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get certificates count (via artworks)
    const { data: artworks } = await supabase
      .from('artworks')
      .select('id')
      .eq('user_id', userId);

    const artworkIds = artworks?.map(a => a.id) || [];

    const { count: certificatesCount } = artworkIds.length > 0
      ? await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .in('artwork_id', artworkIds)
      : { count: 0 };

    // Get collections count
    const { count: collectionsCount } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      artworks: artworksCount || 0,
      certificates: certificatesCount || 0,
      collections: collectionsCount || 0,
    };
  } catch (error) {
    console.error('Error fetching user statistics:', error);
    return {
      artworks: 0,
      certificates: 0,
      collections: 0,
    };
  }
}

/**
 * Get public profile statistics (safe for public viewing)
 * Returns only counts, no sensitive data
 */
export async function getPublicProfileStatistics(userId: string): Promise<{
  artworks: number;
  certificates: number;
  tags_linked?: number;
  scans_this_week?: number;
}> {
  try {
    // Get artworks count
    const { count: artworksCount } = await supabase
      .from('artworks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get certificates count (via artworks)
    const { data: artworks } = await supabase
      .from('artworks')
      .select('id')
      .eq('user_id', userId);

    const artworkIds = artworks?.map(a => a.id) || [];

    const { count: certificatesCount } = artworkIds.length > 0
      ? await supabase
        .from('certificates')
        .select('*', { count: 'exact', head: true })
        .in('artwork_id', artworkIds)
      : { count: 0 };

    // Get NFC tags count (linked tags)
    const { count: tagsLinkedCount } = artworkIds.length > 0
      ? await supabase
        .from('nfc_tags')
        .select('*', { count: 'exact', head: true })
        .in('artwork_id', artworkIds)
        .eq('is_bound', true)
      : { count: 0 };

    // Note: Scans this week would require a scans/logs table
    // For now, we'll return undefined for scans_this_week

    return {
      artworks: artworksCount || 0,
      certificates: certificatesCount || 0,
      tags_linked: tagsLinkedCount || 0,
      scans_this_week: undefined, // TODO: Implement when scans table is available
    };
  } catch (error) {
    console.error('Error fetching public profile statistics:', error);
    return {
      artworks: 0,
      certificates: 0,
      tags_linked: 0,
    };
  }
}

/**
 * Get complete public profile with statistics
 * This is the main function to use for public profile viewing
 */
export async function getPublicProfileWithStats(identifier: string): Promise<PublicProfile | null> {
  const profile = await getPublicProfileByUsernameOrSlug(identifier);
  
  if (!profile) {
    return null;
  }

  // Add statistics to the profile
  const statistics = await getPublicProfileStatistics(profile.id);
  
  return {
    ...profile,
    statistics,
  };
}

