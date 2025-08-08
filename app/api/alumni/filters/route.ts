import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('Alumni Filters API called')
    
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
    
    // Get unique values for each filter
    const { data: industries, error: industriesError } = await supabase
      .from('alumni')
      .select('industry')
      .not('industry', 'is', null)
      .not('industry', 'eq', '')
    
    const { data: chapters, error: chaptersError } = await supabase
      .from('alumni')
      .select('chapter')
      .not('chapter', 'is', null)
      .not('chapter', 'eq', '')
    
    const { data: locations, error: locationsError } = await supabase
      .from('alumni')
      .select('location')
      .not('location', 'is', null)
      .not('location', 'eq', '')
    
    const { data: graduationYears, error: graduationYearsError } = await supabase
      .from('alumni')
      .select('graduation_year')
      .not('graduation_year', 'is', null)
    
    if (industriesError || chaptersError || locationsError || graduationYearsError) {
      console.error('Error fetching filter options:', { industriesError, chaptersError, locationsError, graduationYearsError })
      return NextResponse.json({ 
        error: 'Failed to fetch filter options',
        details: { industriesError, chaptersError, locationsError, graduationYearsError }
      }, { status: 500 })
    }

    // Extract unique values and sort them
    const uniqueIndustries = [...new Set(industries?.map(item => item.industry).filter(Boolean))].sort()
    const uniqueChapters = [...new Set(chapters?.map(item => item.chapter).filter(Boolean))].sort()
    const uniqueLocations = [...new Set(locations?.map(item => item.location).filter(Boolean))].sort()
    const uniqueGraduationYears = [...new Set(graduationYears?.map(item => item.graduation_year).filter(Boolean))].sort((a, b) => b - a)

    return NextResponse.json({
      industries: uniqueIndustries,
      chapters: uniqueChapters,
      locations: uniqueLocations,
      graduationYears: uniqueGraduationYears,
      message: 'Filter options retrieved successfully'
    })

  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 