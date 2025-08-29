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

    // Get current month and last month dates
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Count current month members
    const { count: currentCount, error: currentError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .gte('created_at', currentMonth.toISOString());

    if (currentError) {
      console.error('Error counting current month members:', currentError);
      return NextResponse.json({ error: 'Failed to count current month members' }, { status: 500 });
    }

    // Count last month members
    const { count: lastCount, error: lastError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId)
      .gte('created_at', lastMonth.toISOString())
      .lt('created_at', currentMonth.toISOString());

    if (lastError) {
      console.error('Error counting last month members:', lastError);
      return NextResponse.json({ error: 'Failed to count last month members' }, { status: 500 });
    }

    // Calculate growth percentage
    let growthPercentage = 0;
    if (lastCount && lastCount > 0 && currentCount !== null) {
      growthPercentage = Math.round(((currentCount - lastCount) / lastCount) * 100);
    } else if (currentCount && currentCount > 0) {
      // If no members last month but some this month, it's 100% growth
      growthPercentage = 100;
    }

    return NextResponse.json({ 
      growth: growthPercentage,
      currentMonth: currentCount || 0,
      lastMonth: lastCount || 0
    });

  } catch (error) {
    console.error('Error in membership growth API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
