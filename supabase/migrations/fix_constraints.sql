-- Fix database constraints to match code expectations

-- Check and fix artworks status constraint
-- The constraint should allow 'verified' and 'unverified' (lowercase)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE artworks DROP CONSTRAINT IF EXISTS artworks_status_check;
  
  -- Add correct constraint
  ALTER TABLE artworks ADD CONSTRAINT artworks_status_check 
    CHECK (status IN ('verified', 'unverified'));
END $$;

-- Check and fix nfc_tags binding_status constraint
-- The constraint should allow 'bound' and 'unbound' (lowercase)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE nfc_tags DROP CONSTRAINT IF EXISTS nfc_tags_binding_status_check;
  
  -- Add correct constraint
  ALTER TABLE nfc_tags ADD CONSTRAINT nfc_tags_binding_status_check 
    CHECK (binding_status IN ('bound', 'unbound'));
END $$;

-- Check and fix user_profiles user_type constraint
-- The constraint should allow 'artist', 'gallery', and 'collector' (lowercase)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_type_check;
  
  -- Add correct constraint to allow lowercase values
  ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_user_type_check 
    CHECK (user_type IS NULL OR user_type IN ('artist', 'gallery', 'collector'));
END $$;

-- Update any existing data to match the new constraints
UPDATE artworks SET status = LOWER(status) WHERE status IS NOT NULL;
UPDATE nfc_tags SET binding_status = LOWER(binding_status) WHERE binding_status IS NOT NULL;
-- Normalize user_type to lowercase format if needed
UPDATE user_profiles 
SET user_type = LOWER(user_type) 
WHERE user_type IS NOT NULL 
  AND user_type != LOWER(user_type);

