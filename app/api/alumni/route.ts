import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Alumni API called')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        },
        instructions: [
          'Create a .env.local file in your project root',
          'Add your Supabase credentials:',
          'NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co',
          'SUPABASE_SERVICE_ROLE_KEY=your-service-role-key',
          'Restart your development server after adding the file'
        ]
      }, { status: 500 })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const chapter = searchParams.get('chapter') || ''
    const location = searchParams.get('location') || ''
    const graduationYear = searchParams.get('graduationYear') || ''
    const activelyHiring = searchParams.get('activelyHiring') || ''
    const state = searchParams.get('state') || ''
    
    // Add My Chapter parameters
    const myChapter = searchParams.get('myChapter') || ''
    const userChapter = searchParams.get('userChapter') || ''

    console.log('Query params:', { 
      search, 
      industry, 
      chapter, 
      location, 
      graduationYear, 
      activelyHiring, 
      state,
      myChapter,
      userChapter 
    })

    // Build the query - start simple
    let query = supabase
      .from('alumni')
      .select('*')

    // Apply filters
    if (search) {
      const searchTerm = search.toLowerCase().trim()
      
      // Split search terms for multi-word searches
      const searchTerms = searchTerm.split(/\s+/)
      
      // Build dynamic OR conditions for each search term
      const searchConditions = searchTerms.map(term => 
        `full_name.ilike.%${term}%,company.ilike.%${term}%,job_title.ilike.%${term}%,industry.ilike.%${term}%,chapter.ilike.%${term}%`
      ).join(',')
      
      query = query.or(searchConditions)
    }
    
    if (industry) {
      query = query.eq('industry', industry)
    }
    
    // Handle My Chapter filtering - this takes precedence over regular chapter filter
    if (myChapter === 'true' && userChapter) {
      query = query.eq('chapter', userChapter)
    } else if (chapter) {
      // Only apply regular chapter filter if My Chapter is not active
      query = query.eq('chapter', chapter)
    }
    
    if (location) {
      query = query.eq('location', location)
    }

    if (state) {
      query = query.ilike('location', `%, ${state}`)
    }
    
    if (graduationYear && graduationYear !== 'All Years') {
      if (graduationYear === 'older') {
        query = query.lte('graduation_year', 2019)
      } else {
        query = query.eq('graduation_year', parseInt(graduationYear))
      }
    } 
    
    if (activelyHiring) {
      query = query.eq('is_actively_hiring', true)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    console.log('Executing query with pagination:', { from, to, limit })

    const { data: alumni, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code,
        suggestions: [
          'Check if your alumni table exists in Supabase',
          'Verify your table has the correct column names',
          'Check if RLS policies are blocking access',
          'Try running: ALTER TABLE alumni DISABLE ROW LEVEL SECURITY; in Supabase SQL editor'
        ]
      }, { status: 500 })
    }

    console.log('Query successful, alumni count:', alumni?.length || 0)

    // Transform data to match your interface
    const transformedAlumni = alumni?.map(alumni => ({
      id: alumni.user_id || alumni.id, // Use user_id for connection functionality
      alumniId: alumni.id, // Keep original alumni ID for reference
      firstName: alumni.first_name,
      lastName: alumni.last_name,
      fullName: alumni.full_name,
      chapter: alumni.chapter,
      industry: alumni.industry,
      graduationYear: alumni.graduation_year,
      company: alumni.company,
      jobTitle: alumni.job_title,
      email: alumni.email,
      phone: alumni.phone,
      location: alumni.location,
      description: alumni.description || `Experienced professional in ${alumni.industry}.`,
      mutualConnections: alumni.mutual_connections || [],
      mutualConnectionsCount: alumni.mutual_connections?.length || 0,
      avatar: alumni.avatar_url,
      verified: alumni.verified,
      isActivelyHiring: alumni.is_actively_hiring,
      lastContact: alumni.last_contact,
      tags: alumni.tags || [],
      hasProfile: !!alumni.user_id // This will now be true for all alumni
    })) || []

    return NextResponse.json({
      alumni: transformedAlumni,
      total: count,
      page,
      limit,
      message: `Retrieved ${transformedAlumni.length} alumni records`
    })

  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}