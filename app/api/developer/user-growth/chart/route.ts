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

    // Fetch all profiles in date range (paginate to avoid Supabase 1000-row limit)
    const PAGE_SIZE = 1000;
    let allProfiles: Array<{ id: string; role: string | null; created_at: string; chapter_id: string | null }> = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      let profilesQuery = supabase
        .from('profiles')
        .select('id, role, created_at, chapter_id')
        .order('created_at', { ascending: true })
        .range(from, from + PAGE_SIZE - 1);

      if (chapterId) {
        profilesQuery = profilesQuery.eq('chapter_id', chapterId);
      }

      if (startDate) {
        profilesQuery = profilesQuery.gte('created_at', startDate.toISOString());
      }

      const { data: pageData, error } = await profilesQuery;

      if (error) {
        console.error('Error fetching profiles for chart:', error);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
      }

      if (!pageData || pageData.length === 0) break;
      allProfiles = allProfiles.concat(pageData);
      hasMore = pageData.length === PAGE_SIZE;
      from += PAGE_SIZE;
    }

    const profiles = allProfiles;

    // Group by date and calculate metrics using simplified role-based queries
    const dateMap = new Map<string, {
      total: Set<string>;
      admin: Set<string>;
      alumni: Set<string>;
      activeMember: Set<string>;
    }>();

    profiles?.forEach((profile) => {
      const createdDate = new Date(profile.created_at).toISOString().split('T')[0];
      
      if (!dateMap.has(createdDate)) {
        dateMap.set(createdDate, {
          total: new Set(),
          admin: new Set(),
          alumni: new Set(),
          activeMember: new Set(),
        });
      }

      const dayData = dateMap.get(createdDate)!;
      dayData.total.add(profile.id);

      // Count by role directly (matching the stats API queries)
      if (profile.role === 'admin') {
        dayData.admin.add(profile.id);
      }

      if (profile.role === 'alumni') {
        dayData.alumni.add(profile.id);
      }

      if (profile.role === 'active_member') {
        dayData.activeMember.add(profile.id);
      }
    });

    // Convert to cumulative counts and format for chart
    const sortedDates = Array.from(dateMap.keys()).sort();
    const chartData: Array<{
      date: string;
      total: number;
      admin: number;
      alumni: number;
      activeMember: number;
    }> = [];

    let cumulativeTotal = 0;
    let cumulativeAdmin = 0;
    let cumulativeAlumni = 0;
    let cumulativeActiveMember = 0;

    sortedDates.forEach((date) => {
      const dayData = dateMap.get(date)!;
      cumulativeTotal += dayData.total.size;
      cumulativeAdmin += dayData.admin.size;
      cumulativeAlumni += dayData.alumni.size;
      cumulativeActiveMember += dayData.activeMember.size;

      chartData.push({
        date,
        total: cumulativeTotal,
        admin: cumulativeAdmin,
        alumni: cumulativeAlumni,
        activeMember: cumulativeActiveMember,
      });
    });

    return NextResponse.json(chartData);
  } catch (error) {
    console.error('User growth chart API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
