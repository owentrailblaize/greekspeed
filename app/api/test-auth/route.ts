import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface UserData {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

export async function GET() {
  try {
    // Test Auth API: Called
    
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
    
    // Get all users (for testing purposes)
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Test Auth API: Error fetching users:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch users',
        details: error.message
      }, { status: 500 })
    }
    
    // Test Auth API: Successfully fetched users
    
    return NextResponse.json({
      success: true,
      userCount: users?.length || 0,
      users: users?.map((user: UserData) => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      })) || [],
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Test Auth API: Unexpected error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 