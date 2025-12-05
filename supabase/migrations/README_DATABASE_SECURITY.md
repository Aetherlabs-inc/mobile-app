# Database-Level Security Implementation

This document explains the database-level security measures implemented for profile access control.

## Overview

The security model uses multiple database-level mechanisms to ensure sensitive profile data is never exposed:

1. **Database View** (`public_profiles`) - Only exposes public-safe columns
2. **Secure Function** (`get_public_profile_by_username_or_slug`) - Returns only safe data
3. **RLS Policies** - Restricts access to the base table

## Migration Files

### 1. `create_public_profiles_view.sql`

Creates a database view that only exposes public-safe columns:

```sql
CREATE VIEW public_profiles AS
SELECT 
  id, full_name, username, slug, avatar_url, 
  user_type, bio, location, profile_visibility, created_at
FROM user_profiles
WHERE username IS NOT NULL OR slug IS NOT NULL;
```

**Security Benefits:**
- Sensitive columns (email, phone, etc.) are physically excluded from the view
- Even if someone tries to query the view, they cannot access hidden columns
- The view automatically filters profiles without username/slug

### 2. `add_public_profile_viewing_policy.sql`

Implements RLS policies and a secure database function:

**RLS Policies:**
- Users can view their own complete profile
- Public access to `user_profiles` table is blocked (no public policy)
- Public must use the `public_profiles` view or function

**Secure Function:**
```sql
CREATE FUNCTION get_public_profile_by_username_or_slug(identifier TEXT)
RETURNS TABLE (only public-safe columns)
```

**Security Benefits:**
- Function uses `SECURITY DEFINER` to bypass RLS on the base table
- Function explicitly selects only public-safe columns
- Even with elevated privileges, sensitive data is never returned

## How It Works

### For Public Access

1. **Application queries the view:**
   ```typescript
   const { data } = await supabase
     .from('public_profiles')
     .select('*')
     .eq('username', 'rashodk');
   ```

2. **Or uses the secure function:**
   ```typescript
   const { data } = await supabase
     .rpc('get_public_profile_by_username_or_slug', { identifier: 'rashodk' });
   ```

3. **Database enforces restrictions:**
   - View only contains public-safe columns
   - Function only returns public-safe columns
   - Sensitive columns are physically inaccessible

### For Own Profile

Users query the base table with their own ID:
```typescript
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', userId);
```

RLS policy allows full access to own profile.

## Security Layers

### Layer 1: Database View
- **What**: Physical separation of public vs private columns
- **Protection**: Sensitive columns don't exist in the view
- **Bypass**: Not possible - columns are not in the view definition

### Layer 2: Secure Function
- **What**: Function with explicit column selection
- **Protection**: Even with elevated privileges, only safe columns returned
- **Bypass**: Not possible - function code explicitly excludes sensitive fields

### Layer 3: RLS Policies
- **What**: Row-level access control
- **Protection**: Blocks unauthorized access to base table
- **Bypass**: Not possible - enforced by PostgreSQL

### Layer 4: Application Layer
- **What**: TypeScript types and sanitization functions
- **Protection**: Extra validation and type safety
- **Bypass**: Not possible - enforced by TypeScript compiler

## Migration Order

Run migrations in this order:

1. `create_public_profiles_view.sql` - Creates the view
2. `add_public_profile_viewing_policy.sql` - Creates function and updates RLS

## Testing

### Test 1: Verify view restricts columns

```sql
-- This should work (public columns)
SELECT * FROM public_profiles WHERE username = 'testuser';

-- This should fail (email doesn't exist in view)
SELECT email FROM public_profiles WHERE username = 'testuser';
-- ERROR: column "email" does not exist
```

### Test 2: Verify function restricts columns

```sql
-- This should work (returns only public columns)
SELECT * FROM get_public_profile_by_username_or_slug('testuser');

-- Function definition only includes public columns
-- No way to access email, phone, etc.
```

### Test 3: Verify RLS blocks direct table access

```sql
-- As anonymous user, this should fail
SELECT * FROM user_profiles WHERE username = 'testuser';
-- ERROR: new row-level security policy violation

-- But this should work (using view)
SELECT * FROM public_profiles WHERE username = 'testuser';
```

## Maintenance

### Adding New Public Fields

1. Update the view definition in `create_public_profiles_view.sql`
2. Update the function return type in `add_public_profile_viewing_policy.sql`
3. Update TypeScript `PublicProfile` type
4. Run migrations

### Adding New Private Fields

1. Add column to `user_profiles` table
2. **Do NOT** add to view or function
3. Field is automatically protected

## Troubleshooting

### View not accessible

- Check grants: `GRANT SELECT ON public_profiles TO anon, authenticated;`
- Verify view exists: `\dv public_profiles` in psql

### Function not found

- Check function exists: `\df get_public_profile_by_username_or_slug` in psql
- Verify grants: `GRANT EXECUTE ON FUNCTION ... TO anon, authenticated;`

### RLS blocking access

- Check policies: `SELECT * FROM pg_policies WHERE tablename = 'user_profiles';`
- Verify user context: `SELECT auth.uid();`

---

*Last Updated: Database security implementation*
*Security Model Version: 2.0 (Database-Level)*

