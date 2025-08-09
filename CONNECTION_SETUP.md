# Connection Management Setup Guide

## Overview

The connection management system allows `active_member` profiles to send connection requests to `alumni` profiles displayed in the alumni pipeline table view. This creates a CRM-like lead system where active members can network with alumni.

## Current Status

The connection functionality has been implemented with the following components:

### ✅ Completed
- Connection API endpoints (`/api/connections`, `/api/connections/[id]`)
- Connection management hook (`useConnections`)
- Connection buttons in AlumniTableView and LinkedInStyleAlumniCard
- Connection status tracking (pending, accepted, declined, blocked)
- Connection request/response functionality

### ⚠️ Required Database Setup
- **Issue**: Alumni table is separate from profiles table
- **Solution**: Link alumni to profiles via `user_id` field
- **Status**: Migration script created, needs to be executed

## Database Migration

### Step 1: Run the Migration Script

Execute the following SQL in your Supabase SQL editor:

```sql
-- Migration to add user_id field to alumni table and link to profiles
-- This enables connection functionality between active members and alumni

-- Add user_id column to alumni table
ALTER TABLE alumni ADD COLUMN user_id UUID REFERENCES profiles(id);

-- Create an index for better performance
CREATE INDEX idx_alumni_user_id ON alumni(user_id);

-- Update existing alumni records to link to profiles based on email
-- This assumes that alumni emails match profile emails
UPDATE alumni 
SET user_id = profiles.id 
FROM profiles 
WHERE alumni.email = profiles.email;

-- Add a constraint to ensure user_id is unique (one profile per alumni)
ALTER TABLE alumni ADD CONSTRAINT unique_alumni_user_id UNIQUE (user_id);

-- Create a view to join alumni with profiles for easier querying
CREATE OR REPLACE VIEW alumni_with_profiles AS
SELECT 
  a.*,
  p.email as profile_email,
  p.full_name as profile_full_name,
  p.first_name as profile_first_name,
  p.last_name as profile_last_name,
  p.chapter as profile_chapter,
  p.role as profile_role
FROM alumni a
LEFT JOIN profiles p ON a.user_id = p.id;

-- Add RLS policies for the alumni table
-- Allow users to view all alumni
CREATE POLICY "Allow users to view all alumni" ON alumni
  FOR SELECT USING (true);

-- Allow users to update their own alumni profile
CREATE POLICY "Allow users to update own alumni profile" ON alumni
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow users to insert their own alumni profile
CREATE POLICY "Allow users to insert own alumni profile" ON alumni
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Re-enable RLS
ALTER TABLE alumni ENABLE ROW LEVEL SECURITY;
```

### Step 2: Verify the Migration

Test the migration by calling the test endpoint:

```bash
curl http://localhost:3000/api/test-alumni-profiles
```

This will show you:
- Total alumni and profiles count
- How many alumni are linked to profiles
- Sample data of linked and unlinked records

## How It Works

### 1. Connection Flow
1. **Active Member** views alumni in the pipeline table
2. **Active Member** clicks "Connect" button on an alumni profile
3. **System** creates a connection request in the `connections` table
4. **Alumni** receives the request and can accept/decline
5. **Both parties** can view connection status and manage requests

### 2. Connection States
- **None**: No connection exists
- **Pending Sent**: Connection request sent, waiting for response
- **Pending Received**: Connection request received, needs action
- **Accepted**: Connection established
- **Declined**: Connection request declined
- **Blocked**: Connection blocked

### 3. Database Schema

#### Connections Table
```sql
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID REFERENCES profiles(id) NOT NULL,
  recipient_id UUID REFERENCES profiles(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Alumni Table (Updated)
```sql
-- Added user_id field to link to profiles
ALTER TABLE alumni ADD COLUMN user_id UUID REFERENCES profiles(id);
```

## Testing the Connection System

### 1. Test API Endpoints

```bash
# Test connections table
curl http://localhost:3000/api/test-connections

# Test alumni-profiles relationship
curl http://localhost:3000/api/test-alumni-profiles

# Test profiles table
curl http://localhost:3000/api/test-profiles
```

### 2. Test Connection Flow

1. **Sign up as an active member** with role "Active Member"
2. **Navigate to Alumni Pipeline** (`/dashboard/alumni/pipeline`)
3. **Find an alumni with a linked profile** (shows "Connect" button)
4. **Click "Connect"** to send a connection request
5. **Sign in as the alumni** (if they have a profile)
6. **Check connection status** and accept/decline the request

### 3. Expected Behavior

- Alumni without linked profiles show "No Profile" button (disabled)
- Alumni with linked profiles show appropriate connection buttons
- Connection status updates in real-time
- Connection history is maintained in the database

## Troubleshooting

### Common Issues

1. **"No Profile" buttons showing**
   - Alumni don't have linked profiles
   - Run the migration script to link alumni to profiles
   - Ensure alumni emails match profile emails

2. **Connection buttons not working**
   - Check if user is authenticated
   - Verify alumni have `user_id` values
   - Check browser console for errors

3. **Connection requests not appearing**
   - Verify connections table exists
   - Check RLS policies
   - Ensure API endpoints are working

### Debug Steps

1. **Check database state**:
   ```bash
   curl http://localhost:3000/api/test-alumni-profiles
   ```

2. **Check connection table**:
   ```bash
   curl http://localhost:3000/api/test-connections
   ```

3. **Check browser console** for JavaScript errors

4. **Check network tab** for API request failures

## Next Steps

After completing the migration:

1. **Test the connection flow** with real users
2. **Add connection notifications** (email, in-app)
3. **Implement connection analytics** (success rates, response times)
4. **Add bulk connection features** for active members
5. **Create connection management dashboard** for admins

## Files Modified

- `app/api/alumni/route.ts` - Updated to include user_id and hasProfile
- `lib/mockAlumni.ts` - Updated Alumni interface
- `components/AlumniTableView.tsx` - Added hasProfile handling
- `components/LinkedInStyleAlumniCard.tsx` - Added hasProfile handling
- `ALUMNI_USER_ID_MIGRATION.sql` - Database migration script
- `app/api/test-alumni-profiles/route.ts` - New test endpoint
- `CONNECTION_SETUP.md` - This documentation

## Support

If you encounter issues:

1. Check the test endpoints for database state
2. Verify the migration script executed successfully
3. Ensure all alumni who should be connectable have linked profiles
4. Check that RLS policies are correctly configured 