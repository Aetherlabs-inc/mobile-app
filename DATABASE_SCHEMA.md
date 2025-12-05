# Database Schema Documentation

This document describes the complete database schema for the AetheraApp. Use this as a reference when building features that interact with the database.

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
- `id` (uuid, PRIMARY KEY, FOREIGN KEY → `auth.users.id`)
- `email` (varchar, NOT NULL)
- `full_name` (varchar)
- `avatar_url` (text)
- `user_type` (varchar) - e.g., "Artist", "Gallery", "Collector"
- `bio` (text)
- `website` (text)
- `location` (varchar)
- `phone` (varchar)
- `instagram` (text)
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- One-to-one with `auth.users.id`
- Referenced by `artworks.user_id` (through auth.users)

**Notes:**
- Primary key is also a foreign key to `auth.users.id`
- Row Level Security (RLS) enabled
- Users can only view/update their own profile

---

### 2. `artworks`

Stores details about individual artworks.

**Fields:**
- `id` (uuid, PRIMARY KEY)
- `user_id` (uuid, FOREIGN KEY → `auth.users.id`, NOT NULL)
- `title` (varchar, NOT NULL)
- `artist` (varchar, NOT NULL)
- `year` (int4)
- `medium` (varchar)
- `dimensions` (varchar)
- `status` (varchar) - e.g., "verified", "unverified"
- `image_url` (text)
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- Many-to-one with `auth.users.id` (via `user_id`)
- One-to-many with `certificates` (via `artwork_id`)
- One-to-many with `nfc_tags` (via `artwork_id`)
- One-to-many with `verification_levels` (via `artwork_id`)

**Notes:**
- Row Level Security (RLS) enabled
- Users can only view/update/delete their own artworks
- Image URLs are stored in Supabase Storage

---

### 3. `certificates`

Stores digital certificates of authenticity for artworks.

**Fields:**
- `id` (uuid, PRIMARY KEY)
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, NOT NULL)
- `certificate_id` (varchar, UNIQUE, NOT NULL) - e.g., "CERT-1234567890-ABC123"
- `qr_code_url` (text) - URL to QR code image
- `blockchain_hash` (text) - Blockchain hash for verification
- `generated_at` (timestamptz, DEFAULT NOW())
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- Many-to-one with `artworks` (via `artwork_id`)
- Can be linked to `nfc_tags` (via `certificate_id`)

**Notes:**
- Row Level Security (RLS) enabled
- Users can only access certificates for their own artworks
- `certificate_id` is unique across all certificates
- QR codes are generated and stored as URLs
- Blockchain hash is simulated (can be replaced with real blockchain integration)

---

### 4. `nfc_tags`

Stores information about NFC tags associated with artworks.

**Fields:**
- `id` (uuid, PRIMARY KEY, DEFAULT gen_random_uuid())
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, ON DELETE CASCADE)
- `certificate_id` (uuid, FOREIGN KEY → `certificates.id`, ON DELETE SET NULL, optional)
- `nfc_uid` (varchar, NOT NULL) - Unique NFC tag identifier (hex string, uppercase)
- `is_bound` (bool, DEFAULT false)
- `binding_status` (varchar, DEFAULT 'unbound') - e.g., "BOUND", "UNBOUND", "bound", "unbound"
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- Many-to-one with `artworks` (via `artwork_id`)
- Optional many-to-one with `certificates` (via `certificate_id`)

**Notes:**
- Row Level Security (RLS) enabled
- Users can only access NFC tags for their own artworks (via artwork ownership)
- NFC UID is the physical tag identifier read from hardware
- `certificate_id` field exists in schema but may not be actively used in current implementation
- When artwork is deleted, NFC tag is cascade deleted
- When certificate is deleted, certificate_id should be set to NULL (if foreign key constraint allows)

---

### 5. `verification_levels`

Stores different verification levels for artworks.

**Fields:**
- `id` (uuid, PRIMARY KEY)
- `artwork_id` (uuid, FOREIGN KEY → `artworks.id`, NOT NULL)
- `level` (varchar) - Verification level (e.g., "basic", "advanced", "premium")
- `verified_by` (varchar) - Who verified the artwork
- `verified_at` (timestamptz)
- `created_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- Many-to-one with `artworks` (via `artwork_id`)

**Notes:**
- Row Level Security (RLS) enabled
- Users can only access verification levels for their own artworks
- Can have multiple verification levels per artwork

---

### 6. `survey_responses`

Stores responses from surveys.

**Fields:**
- `id` (uuid, PRIMARY KEY)
- `email` (varchar, NOT NULL)
- `responses` (jsonb) - Flexible JSON structure for survey answers
- `created_at` (timestamptz, DEFAULT NOW())
- `updated_at` (timestamptz, DEFAULT NOW())

**Relationships:**
- No direct relationships with other tables

**Notes:**
- Uses JSONB for flexible response storage
- Can store any survey structure

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

```
auth.users (external)
    ├── user_profiles (1:1)
    └── artworks (1:many)
            ├── certificates (1:many)
            ├── nfc_tags (1:many)
            │   └── certificates (many:1, optional)
            └── verification_levels (1:many)
```

---

## Indexes

Recommended indexes for performance:

- `artworks.user_id` - For filtering artworks by user
- `certificates.artwork_id` - For finding certificates by artwork
- `certificates.certificate_id` - Unique index (already exists)
- `nfc_tags.artwork_id` - For finding NFC tags by artwork
- `nfc_tags.nfc_uid` - For looking up tags by UID
- `verification_levels.artwork_id` - For finding verification levels by artwork
- `user_profiles.id` - Primary key (indexed automatically)

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
  - Path structure: `avatars/{user_id}/{filename}`

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

## Migration Files

Migration files are located in `supabase/migrations/`:

- `create_user_profiles.sql` - Creates user_profiles table
- `create_certificates.sql` - Creates certificates table
- `add_profile_fields.sql` - Adds additional fields to profiles table
- `schema.sql` - Base schema with profiles, artworks, collections tables

**Note**: Migration files for `nfc_tags`, `verification_levels`, and `survey_responses` tables may need to be created. The tables are referenced in the code but may not have dedicated migration files yet.

## SQL Migration Scripts

### Create NFC Tags Table

```sql
-- Create nfc_tags table
CREATE TABLE IF NOT EXISTS nfc_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  certificate_id UUID REFERENCES certificates(id) ON DELETE SET NULL,
  nfc_uid VARCHAR NOT NULL,
  is_bound BOOLEAN DEFAULT false,
  binding_status VARCHAR DEFAULT 'unbound',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE nfc_tags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own nfc_tags" ON nfc_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = nfc_tags.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own nfc_tags" ON nfc_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = nfc_tags.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own nfc_tags" ON nfc_tags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = nfc_tags.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own nfc_tags" ON nfc_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = nfc_tags.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_nfc_tags_artwork_id ON nfc_tags(artwork_id);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_nfc_uid ON nfc_tags(nfc_uid);
CREATE INDEX IF NOT EXISTS idx_nfc_tags_certificate_id ON nfc_tags(certificate_id);

-- Create trigger for updated_at
CREATE TRIGGER update_nfc_tags_updated_at BEFORE UPDATE ON nfc_tags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Create Verification Levels Table

```sql
-- Create verification_levels table
CREATE TABLE IF NOT EXISTS verification_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id) ON DELETE CASCADE,
  level VARCHAR NOT NULL,
  verified_by VARCHAR,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE verification_levels ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own verification_levels" ON verification_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = verification_levels.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own verification_levels" ON verification_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = verification_levels.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own verification_levels" ON verification_levels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = verification_levels.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own verification_levels" ON verification_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM artworks
      WHERE artworks.id = verification_levels.artwork_id
      AND artworks.user_id = auth.uid()
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS idx_verification_levels_artwork_id ON verification_levels(artwork_id);
```

### Create Survey Responses Table

```sql
-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR NOT NULL,
  responses JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (adjust policies based on requirements)
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER update_survey_responses_updated_at BEFORE UPDATE ON survey_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Notes for Development

1. **User ID**: Always use `auth.uid()` in RLS policies to reference the current user
2. **Timestamps**: Use `NOW()` for `created_at` and `updated_at` defaults
3. **UUIDs**: All primary keys use UUID (gen_random_uuid())
4. **Cascading**: Consider CASCADE deletes for related records (e.g., delete certificates when artwork is deleted)
5. **Image URLs**: Store public URLs from Supabase Storage, not file paths
6. **NFC UID**: Store as uppercase hex string for consistency

---

## Future Considerations

- Collections table (referenced in code but not in current schema)
- Gallery/Organization profiles (if user_type is "Gallery")
- Artwork sharing/permissions
- Transaction history
- Marketplace features

---

*Last Updated: Based on schema as of current implementation*
*Schema Version: 1.0*

