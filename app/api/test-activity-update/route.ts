import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const now = new Date().toISOString()
    
    // Update the profiles table with current timestamp
    const { error } = await supabase
      .from('profiles')
      .update({
        last_active_at: now,
        last_login_at: now
      })
      .eq('id', userId)
    
    if (error) {
      console.error('❌ Failed to update activity:', error)
      return NextResponse.json({ 
        error: 'Failed to update activity',
        details: error.message 
      }, { status: 500 })
    }
    
    // Verify the update worked
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, last_active_at, last_login_at')
      .eq('id', userId)
      .single()
    
    if (fetchError) {
      console.error('❌ Failed to fetch updated profile:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to verify update',
        details: fetchError.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Activity updated successfully',
      profile: updatedProfile,
      timestamp: now
    })
    
  } catch (error) {
    console.error('Test activity update error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
