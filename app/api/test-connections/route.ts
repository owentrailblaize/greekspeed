import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    console.log('🔍 Test Connections API: Called');

    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 });
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get connections table structure
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Test Connections API: Error fetching connections:', error);
      return NextResponse.json({
        error: 'Failed to fetch connections',
        details: error.message
      }, { status: 500 });
    }

    console.log('✅ Test Connections API: Successfully fetched connections:', connections?.length || 0);

    // Get table structure by looking at the first connection
    const tableStructure = connections && connections.length > 0 ? Object.keys(connections[0]) : [];

    return NextResponse.json({
      success: true,
      connectionCount: connections?.length || 0,
      tableStructure,
      sampleConnection: connections?.[0] || null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Test Connections API: Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 