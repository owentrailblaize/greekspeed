// lib/middleware/featureFlags.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isFeatureEnabled } from '@/lib/services/featureFlagsService';

export async function checkFeatureAccess(
  request: NextRequest,
  feature: 'financial_tools_enabled' | 'recruitment_crm_enabled'
): Promise<NextResponse | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's chapter
  const { data: profile } = await supabase
    .from('profiles')
    .select('chapter_id')
    .eq('id', session.user.id)
    .single();

  if (!profile?.chapter_id) {
    return NextResponse.json(
      { error: 'User not associated with a chapter' },
      { status: 403 }
    );
  }

  // Check if feature is enabled
  const enabled = await isFeatureEnabled(profile.chapter_id, feature);

  if (!enabled) {
    return NextResponse.json(
      { error: 'This feature is not available for your chapter' },
      { status: 403 }
    );
  }

  // Feature is enabled, allow request to continue
  return null;
}