import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Alumni API called')
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return NextResponse.json({ 
        error: 'Missing environment variables',
        details: {
          hasUrl: !!supabaseUrl,
          hasServiceKey: !!supabaseServiceKey
        }
      }, { status: 500 })
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const chapter = searchParams.get('chapter') || ''
    const location = searchParams.get('location') || ''
    const graduationYear = searchParams.get('graduationYear') || ''
    const state = searchParams.get('state') || ''

    console.log('Query params:', { search, industry, chapter, location, graduationYear, state })

    // Build the query
    let query = supabase
      .from('alumni')
      .select('*')

    // Apply filters
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,company.ilike.%${search}%,job_title.ilike.%${search}%`)
    }
    
    if (industry && industry !== 'All Industries') {
      query = query.eq('industry', industry)
    }
    
    if (chapter && chapter !== 'All Chapters') {
      query = query.eq('chapter', chapter)
    }
    
    if (location && location !== 'All Locations') {
      query = query.eq('location', location)
    }
    
    if (graduationYear && graduationYear !== 'All Years') {
      if (graduationYear === 'older') {
        query = query.lte('graduation_year', 2019)
      } else {
        query = query.eq('graduation_year', parseInt(graduationYear))
      }
    }

    if (state && state !== 'All States') {
      // Assuming you have a state column or can extract state from location
      query = query.ilike('location', `%${state}%`)
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
        code: error.code
      }, { status: 500 })
    }

    console.log('Query successful, alumni count:', alumni?.length || 0)

    // Transform data to match your interface
    const transformedAlumni = alumni?.map(alumni => ({
      id: alumni.id,
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
      tags: alumni.tags || []
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