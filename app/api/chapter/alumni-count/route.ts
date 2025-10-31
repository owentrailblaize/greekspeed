import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/utils/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapter_id');

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID is required' }, { status: 400 });
    }

    // First, get the chapter name from the chapters table
    const { data: chapterData, error: chapterError } = await supabase
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    if (chapterError || !chapterData) {
      logger.error('Failed to fetch chapter name for alumni count', {
        chapterError,
        chapterId,
      });
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Count alumni members using the chapter name (not chapter_id)
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter', chapterData.name) // Use chapter name, not chapter_id
      .eq('member_status', 'alumni');

    if (error) {
      logger.error('Failed to count alumni members', {
        error,
        chapterId,
        chapterName: chapterData.name,
      });
      return NextResponse.json({ error: 'Failed to count alumni' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    logger.error('Alumni count route error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
