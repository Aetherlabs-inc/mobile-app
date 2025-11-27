# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in your project details and wait for it to be created

## 2. Get Your Supabase Credentials

1. Go to your project settings
2. Navigate to **Settings** > **API**
3. Copy the following:
   - **Project URL** (under "Project URL")
   - **Anon/Public Key** (under "Project API keys" > "anon public")

## 3. Set Up Environment Variables

1. Create a `.env` file in the root of your project:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Make sure `.env` is in your `.gitignore` file (it should be by default)

## 4. Set Up Database Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following migrations in order:

### Step 1: Base Schema
Copy and paste the contents of `supabase/schema.sql` and click "Run"

This will create:
- `profiles` table for user profiles
- `artworks` table for artwork data
- `collections` table for collections
- Row Level Security (RLS) policies
- Automatic timestamp triggers

### Step 2: User Profiles Table
Copy and paste the contents of `supabase/migrations/create_user_profiles.sql` and click "Run"

This will create:
- `user_profiles` table with all profile fields (email, full_name, user_type, bio, website, location, phone, instagram, avatar_url)
- Row Level Security (RLS) policies for user_profiles
- Automatic timestamp triggers

**Important:** The app uses the `user_profiles` table for storing user profile data during signup.

## 5. Configure Authentication

1. Go to **Authentication** > **Settings** in your Supabase dashboard
2. Enable **Email** provider (it should be enabled by default)
3. Configure email templates if needed
4. Set up email confirmation settings (optional for development)

## 6. Test the Connection

1. Start your app: `pnpm start`
2. Try signing up with a new account
3. Check your Supabase dashboard to see if the user was created in the `auth.users` table
4. Check if a profile was created in the `profiles` table

## Troubleshooting

### Error: "Supabase URL and Anon Key are required"
- Make sure your `.env` file exists and has the correct variable names
- Restart your Expo dev server after creating/updating `.env`
- The variables must start with `EXPO_PUBLIC_` to be accessible in Expo

### Error: "Failed to sign up"
- Check that email confirmation is disabled for development (or confirm your email)
- Verify your Supabase credentials are correct
- Check the Supabase dashboard logs for errors

### Profile not created after signup
- The profile creation happens automatically in the AuthContext
- If it fails, you can manually create a profile in the Supabase dashboard
- Check the browser console for any error messages

## Next Steps

- Set up image storage using Supabase Storage for artwork images
- Add social authentication (Google, Apple, etc.) if needed
- Configure email templates for better UX
- Set up database backups


