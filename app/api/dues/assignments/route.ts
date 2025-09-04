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
    const cycleId = searchParams.get('cycleId');
    const chapterId = searchParams.get('chapterId') || profile.chapter_id;

    // Check permissions
    if (!canManageChapter(profile.role as any, profile.chapter_role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    let query = supabase
      .from('dues_assignments')
      .select(`
        *,
        user:profiles!dues_assignments_user_id_fkey(
          id,
          full_name,
          first_name,
          last_name,
          email,
          member_status
        ),
        cycle:dues_cycles!dues_assignments_dues_cycle_id_fkey(
          id,
          name,
          due_date,
          close_date
        )
      `)
      .eq('cycle.chapter_id', chapterId);

    if (cycleId) {
      query = query.eq('dues_cycle_id', cycleId);
    }

    const { data: assignments, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching dues assignments:', error);
      return NextResponse.json({ error: 'Failed to fetch dues assignments' }, { status: 500 });
    }

    return NextResponse.json({ assignments: assignments || [] });
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
      return NextResponse.json({ error: 'Only treasurers can assign dues' }, { status: 403 });
    }

    const body = await request.json();
    const { memberId, amount, status, notes, cycleId } = body;

    if (!memberId || !amount || !cycleId) {
      return NextResponse.json({ error: 'Member ID, amount, and cycle ID are required' }, { status: 400 });
    }

    // Create the dues assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('dues_assignments')
      .insert({
        dues_cycle_id: cycleId,
        user_id: memberId,
        status,
        amount_assessed: amount,
        amount_due: amount,
        amount_paid: 0,
        notes
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating dues assignment:', assignmentError);
      return NextResponse.json({ error: 'Failed to create dues assignment' }, { status: 500 });
    }

    // Update the member's profile with dues information
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        current_dues_amount: amount,
        dues_status: status,
        last_dues_assignment_date: new Date().toISOString()
      })
      .eq('id', memberId);

    if (profileUpdateError) {
      console.error('Error updating member profile:', profileUpdateError);
    }

    return NextResponse.json({ 
      message: 'Dues assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: 'Only treasurers can modify dues assignments' }, { status: 403 });
    }

    const body = await request.json();
    const { assignmentId, status, amount_assessed, amount_due, notes } = body;

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Update the dues assignment
    const { data: assignment, error } = await supabase
      .from('dues_assignments')
      .update({
        status,
        amount_assessed,
        amount_due,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating dues assignment:', error);
      return NextResponse.json({ error: 'Failed to update dues assignment' }, { status: 500 });
    }

    // Update the member's profile with new dues information
    if (assignment) {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          current_dues_amount: amount_due,
          dues_status: status,
          last_dues_assignment_date: new Date().toISOString()
        })
        .eq('id', assignment.user_id);

      if (profileUpdateError) {
        console.error('Error updating member profile:', profileUpdateError);
      }
    }

    return NextResponse.json({ 
      message: 'Dues assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
