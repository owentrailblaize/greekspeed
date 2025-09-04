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
    
    const body = await request.json();
    console.log('📥 Creating dues cycle with data:', body);
    
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
      console.error('❌ Missing required fields:', { name, base_amount, due_date });
      return NextResponse.json({ error: 'Name, base amount, and due date are required' }, { status: 400 });
    }

    // For now, use a default chapter_id since we're not authenticating
    const defaultChapterId = '404e65ab-1123-44a0-81c7-e8e75118e741'; // Your chapter ID

    console.log('✅ Creating cycle for chapter:', defaultChapterId);

    // Create the dues cycle with start_date
    const { data: cycle, error: cycleError } = await supabase
      .from('dues_cycles')
      .insert({
        chapter_id: defaultChapterId,
        name,
        start_date: new Date().toISOString().split('T')[0], // Today's date as start_date
        due_date,
        close_date: close_date || null,
        base_amount: parseFloat(base_amount),
        allow_payment_plans,
        plan_options: plan_options || [],
        late_fee_policy: late_fee_policy || null,
        status: 'active'
      })
      .select()
      .single();

    if (cycleError) {
      console.error('❌ Error creating dues cycle:', cycleError);
      return NextResponse.json({ 
        error: 'Failed to create dues cycle', 
        details: cycleError.message 
      }, { status: 500 });
    }

    console.log('✅ Dues cycle created successfully:', cycle);

    return NextResponse.json({ 
      message: 'Dues cycle created successfully',
      cycle
    });
  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
