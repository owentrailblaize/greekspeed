import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { EXECUTIVE_ROLES } from '@/lib/permissions';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const chapterId = searchParams.get('chapter_id') || undefined;
    const startDate = searchParams.get('start_date') || undefined;
    const endDate = searchParams.get('end_date') || undefined;
    const activityWindow = parseInt(searchParams.get('activity_window') || '30');

    // Build base query for total users
    let totalQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // Build query for executive users
    let executiveQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('member_status', 'active')
      .in('chapter_role', EXECUTIVE_ROLES);

    // Build query for alumni users
    let alumniQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'alumni')
      .eq('member_status', 'active');

    // Calculate active member cutoff date
    const activeMemberCutoff = new Date();
    activeMemberCutoff.setDate(activeMemberCutoff.getDate() - activityWindow);
    
    // Build query for active member users
    let activeMemberQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'active_member')
      .eq('member_status', 'active')
      .gte('last_active_at', activeMemberCutoff.toISOString());

    // Apply chapter filter if provided
    if (chapterId) {
      totalQuery = totalQuery.eq('chapter_id', chapterId);
      executiveQuery = executiveQuery.eq('chapter_id', chapterId);
      alumniQuery = alumniQuery.eq('chapter_id', chapterId);
      activeMemberQuery = activeMemberQuery.eq('chapter_id', chapterId);
    }

    // Apply date range filter if provided
    if (startDate) {
      totalQuery = totalQuery.gte('created_at', startDate);
      executiveQuery = executiveQuery.gte('created_at', startDate);
      alumniQuery = alumniQuery.gte('created_at', startDate);
      activeMemberQuery = activeMemberQuery.gte('created_at', startDate);
    }

    if (endDate) {
      totalQuery = totalQuery.lte('created_at', endDate);
      executiveQuery = executiveQuery.lte('created_at', endDate);
      alumniQuery = alumniQuery.lte('created_at', endDate);
      activeMemberQuery = activeMemberQuery.lte('created_at', endDate);
    }

    // Execute queries in parallel
    const [totalResult, executiveResult, alumniResult, activeMemberResult] = await Promise.all([
      totalQuery,
      executiveQuery,
      alumniQuery,
      activeMemberQuery,
    ]);

    if (totalResult.error) {
      console.error('Error fetching total users:', totalResult.error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    return NextResponse.json({
      totalUsers: totalResult.count || 0,
      adminUsers: executiveResult.count || 0,
      alumniUsers: alumniResult.count || 0,
      activeMemberUsers: activeMemberResult.count || 0,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('User growth stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
