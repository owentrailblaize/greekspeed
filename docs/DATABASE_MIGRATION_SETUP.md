# Database & Migration Setup Guide - Trailblaize

## Overview
Trailblaize uses Supabase (PostgreSQL) as its database. This document provides comprehensive setup instructions for local development, migrations, and database management.

## Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works for development)
- Supabase CLI (optional, for local development)

## Environment Variables Required

### Required Supabase Variables
```env
# Public-facing (safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Server-side only (keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### Where to Find These Values
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Never expose this)

## Local Development Setup

### Option 1: Cloud Supabase (Recommended for Quick Start)
1. Create a Supabase project at https://supabase.com
2. Copy environment variables to `.env.local`
3. Run migrations directly against cloud database (see Migration Process below)

### Option 2: Local Supabase Instance (Advanced)
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```
2. Initialize Supabase locally:
   ```bash
   supabase init
   ```
3. Start local Supabase:
   ```bash
   supabase start
   ```
4. Link to local instance:
   ```bash
   supabase link --project-ref local
   ```
5. Update `.env.local` with local credentials (provided by `supabase start`)

## Database Schema Overview

### Core Tables
- `profiles` - User profiles (central user table)
- `chapters` - Greek life chapters (fraternities/sororities)
- `posts` - Social feed posts
- `post_comments` - Comments on posts
- `post_likes` - Likes on posts
- `comment_likes` - Likes on comments
- `events` - Chapter events
- `event_rsvps` - Event RSVPs
- `dues_assignments` - Payment tracking
- `messages` - Direct messages
- `connections` - Alumni networking connections
- `announcements` - Chapter announcements
- `tasks` - Chapter tasks/assignments
- `invitations` - Chapter invitations
- `recruits` - Recruitment submissions
- `documents` - Chapter documents

### Key Relationships
- Users (`profiles`) belong to chapters (`chapters`)
- Posts belong to chapters and have authors (profiles)
- Comments belong to posts and can have parent comments (self-referential)
- All chapter-scoped data is filtered by `chapter_id`

See `docs/DATABASE_SCHEMA.md` for complete schema documentation.

## Migration Process

### Migration File Location
All migrations are stored in: `supabase/migrations/`

### Migration Naming Convention
Format: `YYYYMMDD_description.sql`

Example: `20260203_add_onboarding_completed.sql`

### Creating a New Migration

1. **Create migration file:**
   ```bash
   # Create file in supabase/migrations/
   touch supabase/migrations/$(date +%Y%m%d)_your_migration_name.sql
   ```

2. **Write migration SQL:**
   ```sql
   -- Migration: Add new column to profiles table
   -- Date: 2026-02-03
   -- Description: Adds notification preferences

   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT TRUE;

   -- Add index for performance
   CREATE INDEX IF NOT EXISTS idx_profiles_email_notifications 
   ON profiles(email_notifications_enabled);

   -- Add comment for documentation
   COMMENT ON COLUMN profiles.email_notifications_enabled 
   IS 'Whether the user has email notifications enabled';
   ```

3. **Migration Best Practices:**
   - Always use `IF NOT EXISTS` for safety
   - Add indexes for frequently queried columns
   - Include comments for documentation
   - Test migrations in development first
   - Backup production before running migrations
   - Use transactions when possible
   - Never drop columns without deprecation period

### Running Migrations

#### Method 1: Supabase Dashboard (Recommended for Cloud)
1. Go to Supabase Dashboard → SQL Editor
2. Open your migration file
3. Copy and paste SQL into editor
4. Run migration
5. Verify in Table Editor

#### Method 2: Supabase CLI (For Local or Automated)
```bash
# Push migrations to linked project
supabase db push

# Or apply specific migration
supabase migration up
```

#### Method 3: Direct SQL Execution
1. Connect to your Supabase database (via dashboard or psql)
2. Execute migration SQL directly

### Migration Guidelines

1. **Always Test First:**
   - Test migrations in development database
   - Verify no data loss
   - Check performance impact

2. **Backup Production:**
   - Export data before major migrations
   - Use Supabase backup feature
   - Document rollback procedure

3. **Use Safe Patterns:**
   ```sql
   -- ✅ Good - Safe addition
   ALTER TABLE profiles 
   ADD COLUMN IF NOT EXISTS new_field TEXT;

   -- ✅ Good - Safe index
   CREATE INDEX IF NOT EXISTS idx_name ON table(column);

   -- ❌ Bad - Destructive without check
   ALTER TABLE profiles DROP COLUMN old_field;
   ```

4. **Add Indexes:**
   - Add indexes for foreign keys
   - Add indexes for frequently filtered columns
   - Add indexes for sorted columns

5. **Document Changes:**
   - Include comments in SQL
   - Update `docs/DATABASE_SCHEMA.md` if schema changes
   - Note breaking changes

## Row Level Security (RLS)

### RLS Overview
All tables should have RLS policies enabled to enforce data access control at the database level.

### Common RLS Patterns

#### Chapter-Scoped Access
```sql
-- Users can only see data from their own chapter
CREATE POLICY "Users can view own chapter posts"
ON posts FOR SELECT
USING (
  chapter_id IN (
    SELECT chapter_id FROM profiles WHERE id = auth.uid()
  )
);
```

#### User-Specific Access
```sql
-- Users can only modify their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());
```

#### Role-Based Access
```sql
-- Only exec members can create announcements
CREATE POLICY "Exec can create announcements"
ON announcements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND chapter_role IN ('president', 'vice_president', 'treasurer')
  )
);
```

### Enabling RLS
```sql
-- Enable RLS on a table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## Supabase Client Setup

### Client-Side Client
Location: `lib/supabase/client.ts`

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Usage:** Use in client components for user-scoped operations (respects RLS)

### Server-Side Client
Location: `lib/supabase/client.ts`

```typescript
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}
```

**Usage:** Use in API routes for admin operations (bypasses RLS - use carefully!)

## Common Database Operations

### Querying Data
```typescript
// Get user profile with chapter
const { data } = await supabase
  .from('profiles')
  .select('*, chapters(*)')
  .eq('id', userId)
  .single();

// Get chapter posts with author info
const { data } = await supabase
  .from('posts')
  .select(`
    *,
    author:profiles!author_id(
      id,
      full_name,
      avatar_url
    )
  `)
  .eq('chapter_id', chapterId)
  .order('created_at', { ascending: false });
```

### Inserting Data
```typescript
const { data, error } = await supabase
  .from('posts')
  .insert({
    chapter_id: chapterId,
    author_id: userId,
    content: 'Post content',
    post_type: 'text'
  })
  .select()
  .single();
```

### Updating Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ 
    full_name: 'New Name',
    updated_at: new Date().toISOString()
  })
  .eq('id', userId)
  .select()
  .single();
```

### Deleting Data
```typescript
const { error } = await supabase
  .from('posts')
  .delete()
  .eq('id', postId);
```

## Database Maintenance

### Backup Strategy
1. **Automatic Backups:** Supabase provides daily backups (Pro plan)
2. **Manual Backups:** Use Supabase Dashboard → Database → Backups
3. **Export Data:** Use SQL Editor to export specific tables

### Monitoring
- Check Supabase Dashboard → Database → Performance
- Monitor query performance
- Review slow queries
- Check connection pool usage

### Index Optimization
```sql
-- Check existing indexes
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Analyze table for query optimization
ANALYZE profiles;
```

## Troubleshooting

### Common Issues

1. **Connection Errors:**
   - Verify environment variables are set
   - Check Supabase project is active
   - Verify network connectivity

2. **RLS Policy Errors:**
   - Check user is authenticated
   - Verify RLS policies are correct
   - Use service role key for admin operations (server-side only)

3. **Migration Failures:**
   - Check SQL syntax
   - Verify table/column names
   - Check for conflicting migrations
   - Review Supabase logs

4. **Performance Issues:**
   - Add missing indexes
   - Optimize queries
   - Check for N+1 query problems
   - Review query plans

## Resources

- **Supabase Docs:** https://supabase.com/docs
- **PostgreSQL Docs:** https://www.postgresql.org/docs/
- **Schema Documentation:** `docs/DATABASE_SCHEMA.md`
- **Architecture Docs:** `docs/ARCHITECTURE.md`

## Migration Checklist

Before deploying a migration:
- [ ] Migration file created with proper naming
- [ ] SQL tested in development database
- [ ] Indexes added for new columns
- [ ] Comments added for documentation
- [ ] `docs/DATABASE_SCHEMA.md` updated if schema changes
- [ ] Backup created (for production)
- [ ] Rollback plan documented
- [ ] Migration reviewed by team
- [ ] Applied to development database
- [ ] Verified in development
- [ ] Ready for production deployment
