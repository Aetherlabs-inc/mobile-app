import { supabase } from './supabase';
import { User, ProfileVisibility } from '@/types';

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
  return `https://app.aetherlabs.art/a/${slug}`;
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
 * Get user statistics
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

