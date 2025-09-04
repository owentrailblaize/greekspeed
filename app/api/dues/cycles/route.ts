import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { canManageChapter } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId') || profile.chapter_id;

    // Check permissions
    if (!canManageChapter(profile.role as any, profile.chapter_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get dues cycles for the chapter
    const { data: cycles, error } = await supabase
      .from('dues_cycles')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dues cycles:', error);
      return NextResponse.json({ error: 'Failed to fetch dues cycles' }, { status: 500 });
    }

    return NextResponse.json({ cycles: cycles || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, chapter_id, chapter_role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check if user is treasurer
    if (profile.chapter_role !== 'treasurer' && profile.role !== 'admin') {
      return NextResponse.json({ error: 'Only treasurers can create dues cycles' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      base_amount,
      due_date,
      close_date,
      allow_payment_plans = false,
      plan_options = [],
      late_fee_policy = null
    } = body;

    // Validate required fields
    if (!name || !base_amount || !due_date) {
      return NextResponse.json({ error: 'Name, base amount, and due date are required' }, { status: 400 });
    }

    // Create the dues cycle
    const { data: cycle, error: cycleError } = await supabase
      .from('dues_cycles')
      .insert({
        chapter_id: profile.chapter_id,
        name,
        start_date: new Date().toISOString(),
        due_date,
        close_date: close_date || null,
        base_amount,
        allow_payment_plans,
        plan_options,
        late_fee_policy,
        status: 'active'
      })
      .select()
      .single();

    if (cycleError) {
      console.error('Error creating dues cycle:', cycleError);
      return NextResponse.json({ error: 'Failed to create dues cycle' }, { status: 500 });
    }

    // Auto-generate dues assignments for all active members
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id')
      .eq('chapter_id', profile.chapter_id)
      .eq('member_status', 'active');

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    // Create dues assignments
    const assignments = members?.map(member => ({
      dues_cycle_id: cycle.id,
      user_id: member.id,
      status: 'required',
      amount_assessed: base_amount,
      amount_due: base_amount,
      amount_paid: 0
    })) || [];

    if (assignments.length > 0) {
      const { error: assignmentError } = await supabase
        .from('dues_assignments')
        .insert(assignments);

      if (assignmentError) {
        console.error('Error creating dues assignments:', assignmentError);
        return NextResponse.json({ error: 'Failed to create dues assignments' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      message: 'Dues cycle created successfully',
      cycle,
      assignmentsCreated: assignments.length
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
