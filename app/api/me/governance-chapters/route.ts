import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { getManagedChapterIds } from '@/lib/services/governanceService';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'governance') {
      return NextResponse.json({ chapterIds: [], chapters: [] });
    }

    const chapterIds = await getManagedChapterIds(supabase, user.id);
    if (chapterIds.length === 0) {
      return NextResponse.json({ chapterIds: [], chapters: [] });
    }

    const { data: chapters, error: chaptersError } = await supabase
      .from('chapters')
      .select('id, name')
      .in('id', chapterIds);

    if (chaptersError) {
      return NextResponse.json({ chapterIds, chapters: [] });
    }

    return NextResponse.json({
      chapterIds,
      chapters: (chapters ?? []).map((c) => ({ id: c.id, name: c.name }))
    });
  } catch (error) {
    console.error('governance-chapters API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
