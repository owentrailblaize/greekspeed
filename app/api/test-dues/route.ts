import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Test database connection
    const { data: cycles, error: cyclesError } = await supabase
      .from('dues_cycles')
      .select('*')
      .limit(5);

    const { data: assignments, error: assignmentsError } = await supabase
      .from('dues_assignments')
      .select('*')
      .limit(5);

    return NextResponse.json({
      success: true,
      message: 'Dues system is working',
      cycles: cycles || [],
      assignments: assignments || [],
      cyclesError: cyclesError?.message,
      assignmentsError: assignmentsError?.message
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
