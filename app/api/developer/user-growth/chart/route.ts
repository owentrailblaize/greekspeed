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
    const days = parseInt(searchParams.get('days') || '90'); // Default to 90 days of data

    // Calculate date range
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - days);

    // Fetch all profiles in date range
    let profilesQuery = supabase
      .from('profiles')
      .select('id, role, chapter_role, member_status, created_at, last_active_at, chapter_id');

    if (chapterId) {
      profilesQuery = profilesQuery.eq('chapter_id', chapterId);
    }

    if (startDate) {
      profilesQuery = profilesQuery.gte('created_at', start.toISOString());
    }

    if (endDate) {
      profilesQuery = profilesQuery.lte('created_at', end.toISOString());
    }

    const { data: profiles, error } = await profilesQuery;

    if (error) {
      console.error('Error fetching profiles for chart:', error);
      return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }

    // Group by date and calculate metrics
    const dateMap = new Map<string, {
      total: Set<string>;
      admin: Set<string>;
      alumni: Set<string>;
      activeMember: Set<string>;
    }>();

    const activeMemberCutoff = new Date();
    activeMemberCutoff.setDate(activeMemberCutoff.getDate() - activityWindow);

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

      if (profile.member_status === 'active' && profile.chapter_role && EXECUTIVE_ROLES.includes(profile.chapter_role as any)) {
        dayData.admin.add(profile.id);
      }

      if (profile.role === 'alumni' && profile.member_status === 'active') {
        dayData.alumni.add(profile.id);
      }

      if (
        profile.role === 'active_member' &&
        profile.member_status === 'active' &&
        profile.last_active_at &&
        new Date(profile.last_active_at) >= activeMemberCutoff
      ) {
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
