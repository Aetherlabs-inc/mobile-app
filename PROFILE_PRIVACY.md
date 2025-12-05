# Profile Privacy & Security Model

This document explains how profile data is protected and what information is visible to public users.

## Overview

The AetheraApp implements a multi-layer security approach to protect user privacy while enabling profile sharing functionality.

## Public vs Private Data

### ✅ Public Profile Fields (Safe to Share)

These fields are visible to anyone who views a profile via username or slug:

- `id` - User ID (needed for relationships)
- `full_name` - Display name
- `username` - Instagram-style handle
- `slug` - URL-friendly identifier
- `avatar_url` - Profile picture
- `user_type` - User role (artist, gallery, collector)
- `bio` - User biography/description
- `location` - User location (city, country)
- `profile_visibility` - Visibility setting (private/public)
- `created_at` - Account creation date
- `statistics` - Public statistics (artworks count, certificates count, etc.)

### 🔒 Private Profile Fields (Never Exposed)

These fields are **never** exposed in public profile views:

- `email` - Email address (private contact information)
- `phone` - Phone number (private contact information)
- `instagram` - Instagram handle (excluded for MVP privacy)
- `website` - Website URL (excluded for MVP privacy)
- `updated_at` - Last update timestamp (internal metadata)
- `email_verified` - Email verification status (internal account status)

## Security Layers

### 1. Database Level (RLS Policies)

Row Level Security (RLS) policies control who can access which rows:

- **Own Profile**: Users can always view their own complete profile
- **Public Profiles**: Anyone can view profiles that have a `username` or `slug` set
- **No Username/Slug**: Profiles without username/slug can only be viewed by the owner

**Migration File**: `supabase/migrations/add_public_profile_viewing_policy.sql`

### 2. Query Level (Column Selection)

The `getPublicProfileByUsernameOrSlug()` function only selects public-safe columns:

```typescript
const publicFields = 'id, full_name, username, slug, avatar_url, user_type, bio, location, profile_visibility, created_at';
```

This ensures that even if RLS allows access, sensitive columns are never fetched.

### 3. Application Level (Data Sanitization)

The `sanitizeProfileForPublic()` function provides an extra layer of protection by explicitly filtering out sensitive fields before returning data.

## Functions

### For Public Profile Viewing

```typescript
// Get public profile (safe for sharing)
const profile = await getPublicProfileByUsernameOrSlug('rashodk');

// Get public profile with statistics
const profileWithStats = await getPublicProfileWithStats('rashodk');
```

### For Authenticated Users

```typescript
// Get full profile (includes sensitive data)
const fullProfile = await getProfileByUsernameOrSlug('rashodk');
```

## Usage Examples

### Web API Endpoint (Future)

When implementing the web profile page (`https://www.aetherlabs.art/a/{slug}`), use:

```typescript
import { getPublicProfileWithStats } from '@/lib/profile';

// In your API route
const profile = await getPublicProfileWithStats(slug);
if (!profile) {
  return { error: 'Profile not found' };
}

// profile contains only public-safe data
return { profile };
```

### Mobile App

For viewing other users' profiles in the mobile app:

```typescript
import { getPublicProfileWithStats } from '@/lib/profile';

const publicProfile = await getPublicProfileWithStats('rashodk');
// Only contains public-safe fields
```

## Statistics Privacy

Public statistics only include counts, never individual records:

- ✅ Artworks count
- ✅ Certificates count
- ✅ Tags linked count
- ❌ Individual artwork details
- ❌ Individual certificate details
- ❌ Individual tag details

## Profile Visibility Setting

The `profile_visibility` field currently has two states:

- `private` (default): Profile link shows basic info, but artworks remain hidden
- `public` (future): Profile link may show artworks (not implemented in MVP)

**Note**: Even with `profile_visibility = 'public'`, sensitive fields (email, phone, etc.) are never exposed.

## Best Practices

1. **Always use `getPublicProfileWithStats()`** for public profile viewing
2. **Never expose email or phone** in any public context
3. **Validate user input** when looking up profiles by username/slug
4. **Handle null cases** - profiles may not exist or may not have username/slug
5. **Log access attempts** for security monitoring (future enhancement)

## Migration

To apply the RLS policy changes:

1. Open Supabase Dashboard → SQL Editor
2. Run: `supabase/migrations/add_public_profile_viewing_policy.sql`
3. Verify the policies are active in the Supabase Dashboard

## Future Enhancements

- [ ] Add rate limiting for profile lookups
- [ ] Add access logging for security monitoring
- [ ] Implement `profile_visibility = 'public'` artwork viewing
- [ ] Add optional public contact fields (website, instagram) with user consent
- [ ] Add profile view analytics (view count, etc.)

---

*Last Updated: Based on current implementation*
*Security Model Version: 1.0*

