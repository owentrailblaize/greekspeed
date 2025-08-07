# Supabase Setup Guide

## Step 1: Create Environment File

Create a `.env.local` file in your project root (same level as `package.json`) with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to Settings → API
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (not the anon key!)

## Step 3: Create the Alumni Table

Run this SQL in your Supabase SQL editor:

```sql
CREATE TABLE alumni (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  chapter VARCHAR NOT NULL,
  industry VARCHAR NOT NULL,
  graduation_year INTEGER NOT NULL,
  company VARCHAR NOT NULL,
  job_title VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  phone VARCHAR,
  location VARCHAR NOT NULL,
  description TEXT,
  avatar_url VARCHAR,
  verified BOOLEAN DEFAULT false,
  is_actively_hiring BOOLEAN DEFAULT false,
  last_contact DATE,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Temporarily disable RLS for testing
ALTER TABLE alumni DISABLE ROW LEVEL SECURITY;
```

## Step 4: Add Sample Data

Run this SQL to add sample data:

```sql
INSERT INTO alumni (
  first_name, last_name, full_name, chapter, industry, graduation_year,
  company, job_title, email, phone, location, description, verified, is_actively_hiring
) VALUES 
('Connor', 'McMullan', 'Connor McMullan', 'Sigma Chi', 'Technology', 2024,
 'Microsoft', 'Software Engineer', 'connor.mcmullan@microsoft.com', '(601) 555-0123', 'Jackson, MS',
 'Recently graduated from University of Mississippi with a Computer Science degree. Passionate about cloud computing and AI.', false, false),
('Brett', 'Ashy', 'Brett Ashy', 'Sigma Chi', 'Finance', 2023,
 'Goldman Sachs', 'Investment Analyst', 'brett.ashy@gs.com', '(601) 555-0456', 'Atlanta, GA',
 'University of Mississippi Graduate with Finance degree. Specializing in investment banking and market analysis.', true, false);
```

## Step 5: Test the Connection

1. Restart your development server: `npm run dev`
2. Test the environment: `http://localhost:3000/api/test-env`
3. Test Supabase connection: `http://localhost:3000/api/test-supabase`
4. Test alumni API: `http://localhost:3000/api/alumni`

## Troubleshooting

### If you get "Missing environment variables":
- Make sure `.env.local` exists in the project root
- Restart your development server after creating the file
- Check that the variable names are exactly correct

### If you get "Database query failed":
- Check if the `alumni` table exists in your Supabase dashboard
- Verify the table has the correct column names
- Try disabling RLS temporarily: `ALTER TABLE alumni DISABLE ROW LEVEL SECURITY;`

### If you get 404 errors:
- Make sure the API route file is named `route.ts` (not `routes.ts`)
- Check that the file is in the correct location: `app/api/alumni/route.ts`
- Restart your development server 