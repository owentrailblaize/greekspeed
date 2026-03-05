import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    
    const chapterId = searchParams.get('chapter_id') || undefined;
    const activityWindowParam = searchParams.get('activity_window') || '30';
    const activityWindow = activityWindowParam === 'all' ? null : parseInt(activityWindowParam);

    // Calculate date range based on activity window
    const now = new Date();
    const startDate = activityWindow ? new Date(now.getTime() - activityWindow * 24 * 60 * 60 * 1000) : null;
    
    // Calculate previous period (7 days ago) for week-over-week comparison
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const previousStartDate = activityWindow ? new Date(sevenDaysAgo.getTime() - activityWindow * 24 * 60 * 60 * 1000) : null;

    // Helper function to build base query with filters
    const buildQuery = (roleFilter?: string, usePreviousPeriod = false) => {
      let query = supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      
      if (chapterId) {
        query = query.eq('chapter_id', chapterId);
      }
      
      const dateThreshold = usePreviousPeriod ? previousStartDate : startDate;
      
      if (dateThreshold) {
        query = query.gte('created_at', dateThreshold.toISOString());
      }
      
      if (usePreviousPeriod) {
        query = query.lte('created_at', sevenDaysAgo.toISOString());
      }
      
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      return query;
    };

    // Execute all queries in parallel
    // Using the exact query pattern: COUNT(*) WHERE role = 'X'
    const [
      totalResult,
      adminResult,
      activeMemberResult,
      alumniResult,
      totalPrevious,
      adminPrevious,
      activeMemberPrevious,
      alumniPrevious,
    ] = await Promise.all([
      // Current period: Total profiles (all profiles)
      buildQuery(),
      // Current period: Admin users (role = 'admin')
      buildQuery('admin'),
      // Current period: Active member users (role = 'active_member')
      buildQuery('active_member'),
      // Current period: Alumni users (role = 'alumni')
      buildQuery('alumni'),
      // Previous period: Total profiles
      buildQuery(undefined, true),
      // Previous period: Admin users
      buildQuery('admin', true),
      // Previous period: Active member users
      buildQuery('active_member', true),
      // Previous period: Alumni users
      buildQuery('alumni', true),
    ]);

    // Check for errors
    if (totalResult.error) {
      console.error('Error fetching total users:', totalResult.error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const totalUsers = totalResult.count || 0;
    const adminUsers = adminResult.count || 0;
    const activeMemberUsers = activeMemberResult.count || 0;
    const alumniUsers = alumniResult.count || 0;

    return NextResponse.json({
      totalUsers,
      adminUsers,
      alumniUsers,
      activeMemberUsers,
      lastUpdated: new Date().toISOString(),
      previousPeriod: {
        totalUsers: totalPrevious.count || 0,
        adminUsers: adminPrevious.count || 0,
        alumniUsers: alumniPrevious.count || 0,
        activeMemberUsers: activeMemberPrevious.count || 0,
      },
    });
  } catch (error) {
    console.error('User growth stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
