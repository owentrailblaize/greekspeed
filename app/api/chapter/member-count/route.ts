import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

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

    // Just count members, don't fetch all the data
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    if (error) {
      logger.error('Error counting members:', { context: [error] });
      return NextResponse.json({ error: 'Failed to count members' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    logger.error('Error in member count API:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
