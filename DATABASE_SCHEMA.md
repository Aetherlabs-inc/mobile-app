# Database Schema Documentation

This document describes the complete database schema for the AetheraApp based on the actual database schema. Use this as a reference when building features that interact with the database.

## Overview

The database consists of 6 main tables:

1. `user_profiles` - User profile information
2. `artworks` - Artwork records
3. `certificates` - Digital certificates of authenticity
4. `nfc_tags` - NFC tag associations
5. `verification_levels` - Artwork verification records
6. `survey_responses` - Survey response data

All tables reference `auth.users.id` from Supabase Auth for user authentication.

---

## Tables

### 1. `user_profiles`

Stores detailed profile information for users.

**Fields:**

- `id` (uuid, PRIMARY KEY, NOT NULL, FOREIGN KEY → `auth.users.id`)
- `email` (varchar, NOT NULL)
- `full_name` (varchar, nullable)
- `avatar_url` (text, nullable)
- `user_type` (varchar, DEFAULT 'artist', CHECK constraint) - Must be one of: 'artist', 'gallery', 'collector'
- `bio` (text, nullable)
- `website` (text, nullable)
- `location` (varchar, nullable)
- `phone` (varchar, nullable)
- `instagram` (text, nullable)
- `username` (varchar, nullable) - Instagram-style handle
- `profile_visibility` (varchar, DEFAULT 'private', CHECK constraint) - Must be 'private' or 'public'
- `slug` (varchar, nullable) - URL-friendly identifier for profile sharing
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `profile_visibility` CHECK constraint: must be 'private' or 'public'
- `user_type` CHECK constraint: must be one of ('artist', 'gallery', 'collector')
- `user_type` defaults to 'artist'
- `profile_visibility` defaults to 'private'
- Primary key `id` is also a foreign key to `auth.users.id`

**Relationships:**

- One-to-one with `auth.users.id`
- Referenced by `artworks.user_id` (through auth.users)

**Notes:**

- Row Level Security (RLS) enabled
- Users can only view/update their own profile
- `slug` is used for generating shareable profile URLs (e.g., `https://www.aetherlabs.art/a/{slug}`)
- `username` uniqueness is enforced at application level (not via SQL constraint)

---

### 2. `artworks`

Stores details about individual artworks.

**Fields:**

- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (uuid, FOREIGN KEY → `auth.users.id`, nullable)
- `title` (varchar, NOT NULL)
- `artist` (varchar, NOT NULL)
- `year` (integer, NOT NULL)
- `medium` (varchar, NOT NULL)
- `dimensions` (varchar, NOT NULL)
- `status` (varchar, DEFAULT 'unverified', CHECK constraint) - Must be 'verified' or 'unverified'
- `image_url` (text, nullable)
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `status` CHECK constraint: must be 'verified' or 'unverified'
- `year`, `medium`, `dimensions` are required fields (NOT NULL)

**Relationships:**

- Many-to-one with `auth.users.id` (via `user_id`)
- One-to-many with `certificates` (via `artwork_id`)
- One-to-many with `nfc_tags` (via `artwork_id`)
- One-to-many with `verification_levels` (via `artwork_id`)

**Notes:**

- Row Level Security (RLS) enabled
- Users can only view/update/delete their own artworks
- Image URLs are stored in Supabase Storage
- `user_id` is nullable in schema (should be set in application code)

---

### 3. `certificates`

Stores digital certificates of authenticity for artworks.

**Fields:**

- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, nullable)
- `certificate_id` (varchar, UNIQUE, NOT NULL) - e.g., "CERT-1234567890-ABC123"
- `qr_code_url` (text, nullable) - URL to QR code image
- `blockchain_hash` (text, nullable) - Blockchain hash for verification
- `generated_at` (timestamptz, DEFAULT NOW())
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `certificate_id` is UNIQUE across all certificates
- `artwork_id` is nullable in schema (should be set in application code)

**Relationships:**

- Many-to-one with `artworks` (via `artwork_id`)

**Notes:**

- Row Level Security (RLS) enabled
- Users can only access certificates for their own artworks
- QR codes are generated and stored as URLs
- Blockchain hash is simulated (can be replaced with real blockchain integration)
- `generated_at` defaults to current timestamp

---

### 4. `nfc_tags`

Stores information about NFC tags associated with artworks.

**Fields:**

- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, nullable)
- `nfc_uid` (varchar, UNIQUE, NOT NULL) - Unique NFC tag identifier (hex string, uppercase)
- `is_bound` (boolean, DEFAULT false)
- `binding_status` (varchar, DEFAULT 'pending', CHECK constraint) - Must be 'bound' or 'unbound'
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `nfc_uid` is UNIQUE across all NFC tags
- `binding_status` CHECK constraint: must be 'bound' or 'unbound'
- `binding_status` defaults to 'pending' (note: constraint only allows 'bound' or 'unbound', so 'pending' may need to be updated)
- `artwork_id` is nullable in schema (should be set in application code)

**Relationships:**

- Many-to-one with `artworks` (via `artwork_id`)

**Notes:**

- Row Level Security (RLS) enabled
- Users can only access NFC tags for their own artworks (via artwork ownership)
- NFC UID is the physical tag identifier read from hardware
- Each NFC tag UID must be unique across the entire system
- `binding_status` default value is 'pending', but CHECK constraint only allows 'bound' or 'unbound' (may need migration to fix)

---

### 5. `verification_levels`

Stores different verification levels for artworks.

**Fields:**

- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, nullable)
- `level` (varchar, NOT NULL, CHECK constraint) - Must be one of: 'unverified', 'artist_verified', 'gallery_verified', 'third_party_verified'
- `verified_by` (varchar, nullable) - Who verified the artwork
- `verified_at` (timestamptz, DEFAULT NOW())
- `created_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `level` CHECK constraint: must be one of ('unverified', 'artist_verified', 'gallery_verified', 'third_party_verified')
- `level` is required (NOT NULL)
- `artwork_id` is nullable in schema (should be set in application code)

**Relationships:**

- Many-to-one with `artworks` (via `artwork_id`)

**Notes:**

- Row Level Security (RLS) enabled
- Users can only access verification levels for their own artworks
- Can have multiple verification levels per artwork
- `verified_at` defaults to current timestamp

---

### 6. `survey_responses`

Stores responses from surveys.

**Fields:**

- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `email` (varchar, nullable)
- `responses` (jsonb, NOT NULL) - Flexible JSON structure for survey answers
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Constraints:**

- `responses` is required (NOT NULL)
- `email` is nullable

**Relationships:**

- No direct relationships with other tables

**Notes:**

- Uses JSONB for flexible response storage
- Can store any survey structure
- Row Level Security (RLS) enabled (policies depend on requirements)

---

## External References

### `auth.users` (Supabase Auth)

This is the Supabase authentication table (not managed by this app).

**Referenced by:**

- `user_profiles.id` (one-to-one)
- `artworks.user_id` (many-to-one)

**Notes:**

- Managed by Supabase Auth
- Contains authentication information (email, password hash, etc.)
- `id` is a UUID used as foreign key in other tables

---

## Relationships Summary

```text
auth.users (external)
    ├── user_profiles (1:1)
    └── artworks (1:many)
            ├── certificates (1:many)
            ├── nfc_tags (1:many)
            └── verification_levels (1:many)
```

---

## Indexes

**Note:** The following indexes are recommended or may exist in the database, but are not explicitly shown in the schema dump:

**user_profiles:**

- Primary key `id` (indexed automatically)
- Recommended: `idx_user_profiles_user_type` on `user_type`
- Recommended: `idx_user_profiles_username` on `username`
- Recommended: `idx_user_profiles_slug` on `slug` (for profile URL lookups)

**artworks:**

- Primary key `id` (indexed automatically)
- Recommended: Index on `user_id` for filtering artworks by user

**certificates:**

- Primary key `id` (indexed automatically)
- `certificate_id` is UNIQUE (automatically indexed)
- Recommended: Index on `artwork_id` for finding certificates by artwork

**nfc_tags:**

- Primary key `id` (indexed automatically)
- `nfc_uid` is UNIQUE (automatically indexed)
- Recommended: Index on `artwork_id` for finding NFC tags by artwork

**verification_levels:**

- Primary key `id` (indexed automatically)
- Recommended: Index on `artwork_id` for finding verification levels by artwork

---

## Row Level Security (RLS)

All tables have RLS enabled. Policies ensure:

1. **user_profiles**: Users can only view/update their own profile
2. **artworks**: Users can only view/update/delete their own artworks
3. **certificates**: Users can only access certificates for their own artworks
4. **nfc_tags**: Users can only access NFC tags for their own artworks
5. **verification_levels**: Users can only access verification levels for their own artworks
6. **survey_responses**: Access policies depend on requirements

---

## Storage Buckets

Supabase Storage buckets used:

- `artwork_images` - Stores artwork images
  - Path structure: `{user_id}/{filename}`
- `avatars` - Stores user profile pictures
  - Path structure: `avatars/{user_id}/{filename}` (or `{user_id}/{filename}`)
  - Note: Old avatars should be deleted when a new one is uploaded

---

## Common Queries

### Get all artworks for a user

```sql
SELECT * FROM artworks WHERE user_id = $1 ORDER BY created_at DESC;
```

### Get artwork with certificate

```sql
SELECT a.*, c.* 
FROM artworks a
LEFT JOIN certificates c ON c.artwork_id = a.id
WHERE a.id = $1;
```

### Get artwork with NFC tag

```sql
SELECT a.*, n.* 
FROM artworks a
LEFT JOIN nfc_tags n ON n.artwork_id = a.id
WHERE a.id = $1 AND n.is_bound = true;
```

### Get user statistics

```sql
-- Artworks count
SELECT COUNT(*) FROM artworks WHERE user_id = $1;

-- Certificates count (via artworks)
SELECT COUNT(*) FROM certificates c
JOIN artworks a ON a.id = c.artwork_id
WHERE a.user_id = $1;

-- NFC tags count
SELECT COUNT(*) FROM nfc_tags n
JOIN artworks a ON a.id = n.artwork_id
WHERE a.user_id = $1 AND n.is_bound = true;
```

---

## Important Schema Notes

### Field Requirements

1. **artworks table**: `year`, `medium`, and `dimensions` are required fields (NOT NULL)
2. **nfc_tags table**: `nfc_uid` must be unique across all tags
3. **certificates table**: `certificate_id` must be unique across all certificates
4. **verification_levels table**: `level` is required and must match specific values

### Default Values

1. **user_profiles**: `user_type` defaults to 'artist', `profile_visibility` defaults to 'private'
2. **artworks**: `status` defaults to 'unverified'
3. **nfc_tags**: `is_bound` defaults to false, `binding_status` defaults to 'pending' (but constraint only allows 'bound' or 'unbound')
4. **certificates**: `generated_at` defaults to current timestamp
5. **verification_levels**: `verified_at` defaults to current timestamp

### Constraint Values

All CHECK constraint values are lowercase:

- **artworks.status**: 'verified', 'unverified'
- **nfc_tags.binding_status**: 'bound', 'unbound'
- **user_profiles.user_type**: 'artist', 'gallery', 'collector'
- **user_profiles.profile_visibility**: 'private', 'public'
- **verification_levels.level**: 'unverified', 'artist_verified', 'gallery_verified', 'third_party_verified'

### Potential Issues

1. **nfc_tags.binding_status**: Default value is 'pending', but CHECK constraint only allows 'bound' or 'unbound'. This may cause issues when inserting new records. Consider updating the default to 'unbound' or removing the default.

2. **Nullable Foreign Keys**: Several foreign key fields (`artwork_id`, `user_id`) are nullable in the schema. Application code should ensure these are set appropriately.

---

## Profile Sharing

The `profile_visibility` and `slug` fields enable profile sharing functionality:

- **Private (default)**: Profile link shows basic info (name, avatar, bio, country, stats) but artworks remain hidden
- **Public (future)**: Profile link may show artworks (MVP still hides artworks)
- **Slug**: URL-friendly identifier used in shareable links: `https://www.aetherlabs.art/a/{slug}`
- **Username**: Instagram-style handle for user identification

---

## Migration Files

Migration files are located in `supabase/migrations/`:

**Core Tables:**

- `create_user_profiles.sql` - Creates user_profiles table with basic fields
- `create_certificates.sql` - Creates certificates table
- `schema.sql` - Base schema with profiles, artworks, collections tables

**Profile Enhancements:**

- `add_profile_fields.sql` - Adds user_type, location, website, bio, instagram fields
- `add_username_to_user_profiles.sql` - Adds username field with index
- `add_profile_visibility_and_slug.sql` - Adds profile_visibility and slug fields for profile sharing

**Constraints & Fixes:**

- `fix_constraints.sql` - Fixes CHECK constraints for status, binding_status, and user_type fields (normalizes to lowercase)

**Note**: The actual database schema may differ from migration files. Always refer to `database_scheme.sql` for the current state of the database.

---

## Notes for Development

1. **User ID**: Always use `auth.uid()` in RLS policies to reference the current user
2. **Timestamps**: Use `NOW()` for `created_at` and `updated_at` defaults
3. **UUIDs**: All primary keys use UUID (gen_random_uuid())
4. **Image URLs**: Store public URLs from Supabase Storage, not file paths
5. **NFC UID**: Store as uppercase hex string for consistency. Must be unique across all tags.
6. **Profile Visibility**: Defaults to 'private' for MVP. Controls what is visible on shared profile links
7. **Slug Generation**: Slugs are generated and validated in application code, not enforced via SQL constraints
8. **Username Validation**: Username uniqueness and format validation handled in application code
9. **Required Fields**: Ensure `year`, `medium`, and `dimensions` are provided when creating artworks
10. **Verification Levels**: Use specific values: 'unverified', 'artist_verified', 'gallery_verified', 'third_party_verified'

---

## Future Considerations

- Collections table (exists in schema.sql but not in current database schema)
- Gallery/Organization profiles (user_type "gallery" is supported)
- Artwork sharing/permissions (profile_visibility sets foundation)
- Transaction history
- Marketplace features
- Public profile web pages (slug field enables this)
- Username uniqueness constraint at database level (currently application-level)
- Fix `nfc_tags.binding_status` default value to match CHECK constraint

---

*Last Updated: Based on actual database schema from database_scheme.sql*
*Schema Version: 2.1*
