// app/api/chapters/[id]/features/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { ChapterFeatureFlags, DEFAULT_FEATURE_FLAGS } from '@/types/featureFlags';

function createApiSupabaseClient(request: NextRequest) {
  return createServerClient(
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: chapterId } = await params;
    const supabase = createApiSupabaseClient(request);

    // Get user session to verify access
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user belongs to this chapter
    const { data: profile } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', session.user.id)
      .single();

    if (profile?.chapter_id !== chapterId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch feature flags
    const { data: chapter, error } = await supabase
      .from('chapters')
      .select('feature_flags')
      .eq('id', chapterId)
      .single();

    if (error || !chapter?.feature_flags) {
      return NextResponse.json(DEFAULT_FEATURE_FLAGS);
    }

    // Merge with defaults
    const flags: ChapterFeatureFlags = {
      ...DEFAULT_FEATURE_FLAGS,
      ...(chapter.feature_flags as Partial<ChapterFeatureFlags>),
    };

    return NextResponse.json(flags);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}