import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { userId, activityType, metadata } = await request.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const now = new Date().toISOString()
    
    // Update the profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        last_active_at: now,
        // Update last_login_at for login activities
        ...(activityType === 'login' && { last_login_at: now })
      })
      .eq('id', userId)
    
    if (error) {
      logger.error('Failed to track activity', { error, userId, activityType })
      return NextResponse.json({ 
        error: 'Failed to track activity',
        details: error.message 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Activity tracked successfully',
      timestamp: now
    })
    
  } catch (error) {
    logger.error('Activity API error', { error })
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
