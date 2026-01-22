import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    // Count alumni members using role field (not member_status) and chapter_id
    // Note: Alumni have role='alumni' but member_status='active', so we must filter by role
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .eq('role', 'alumni');

    if (error) {
      console.error('Error counting alumni:', error);
      return NextResponse.json({ error: 'Failed to count alumni' }, { status: 500 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in alumni count API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
