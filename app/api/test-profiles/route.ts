import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    console.log('🔍 Test Profiles API: Called')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      }, { status: 500 })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get profiles table structure
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (error) {
      console.error('❌ Test Profiles API: Error fetching profiles:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch profiles',
        details: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Test Profiles API: Successfully fetched profiles:', profiles?.length || 0)
    
    // Get table structure by looking at the first profile
    const tableStructure = profiles && profiles.length > 0 ? Object.keys(profiles[0]) : []
    
    return NextResponse.json({
      success: true,
      profileCount: profiles?.length || 0,
      tableStructure,
      sampleProfile: profiles?.[0] || null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test Profiles API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 