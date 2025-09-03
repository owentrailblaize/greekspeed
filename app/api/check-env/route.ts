import { NextResponse } from 'next/server';

export async function GET() {
  const requiredEnvVars = {
    stripe: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    },
    app: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    },
    supabase: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };

  const missingVars: string[] = [];
  const presentVars: Array<{
    key: string;
    category: string;
    length: number;
    preview: string;
  }> = [];

  // Check all environment variables
  Object.entries(requiredEnvVars).forEach(([category, vars]) => {
    Object.entries(vars).forEach(([key, value]) => {
      if (!value) {
        missingVars.push(key);
      } else {
        presentVars.push({
          key,
          category,
          length: value.length,
          preview: value.substring(0, 10) + '...',
        });
      }
    });
  });

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    summary: {
      total: Object.values(requiredEnvVars).flat().length,
      present: presentVars.length,
      missing: missingVars.length,
    },
    missing: missingVars,
    present: presentVars,
    recommendations: missingVars.length > 0 ? [
      'Add missing environment variables to your .env.local file',
      'For production, add them to your Vercel environment variables',
      'Make sure to restart your development server after adding .env.local',
    ] : [
      'All required environment variables are present',
      'You can proceed with testing the Stripe integration',
    ],
  });
}
