import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Add this helper function at the top of the file
const getChapterId = async (supabase: any, chapterIdentifier: string): Promise<string | null> => {
  // If it's already a UUID, return it
  if (chapterIdentifier.length === 36 && chapterIdentifier.includes('-')) {
    return chapterIdentifier;
  }
  
  // If it's a name, look it up
  const { data } = await supabase
    .from('chapters')
    .select('id')
    .eq('name', chapterIdentifier)
    .single();
  
  return data?.id || null;
};

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Alumni API called')
    
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
    
    // Chapter filtering parameter
    const userChapter = searchParams.get('userChapter') || ''

    console.log('📋 Query params:', { 
      search, 
      industry, 
      chapter, 
      location, 
      graduationYear, 
      activelyHiring, 
      state,
      userChapter 
    })

    // Build the query - start simple
    let query = supabase
      .from('alumni')
      .select(`
        *,
        profile:profiles!user_id(
          avatar_url
        )
      `)

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
    
    // Handle chapter filtering - apply user's chapter filter if provided
    if (userChapter) {
      const chapterId = await getChapterId(supabase, userChapter);
      if (chapterId) {
        // Create two separate queries and apply ALL filters to both
        let chapterNameQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url
            )
          `)
          .eq('chapter', userChapter);
        
        let chapterIdQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url
            )
          `)
          .eq('chapter_id', chapterId);
        
        // Apply all other filters to both queries
        if (search) {
          const searchTerm = search.toLowerCase().trim()
          const searchTerms = searchTerm.split(/\s+/)
          const searchConditions = searchTerms.map(term => 
            `full_name.ilike.%${term}%,company.ilike.%${term}%,job_title.ilike.%${term}%,industry.ilike.%${term}%,chapter.ilike.%${term}%`
          ).join(',')
          
          chapterNameQuery = chapterNameQuery.or(searchConditions);
          chapterIdQuery = chapterIdQuery.or(searchConditions);
        }
        
        if (industry) {
          chapterNameQuery = chapterNameQuery.eq('industry', industry);
          chapterIdQuery = chapterIdQuery.eq('industry', industry);
        }
        
        if (location) {
          chapterNameQuery = chapterNameQuery.eq('location', location);
          chapterIdQuery = chapterIdQuery.eq('location', location);
        }
        
        if (state) {
          chapterNameQuery = chapterNameQuery.ilike('location', `%, ${state}`);
          chapterIdQuery = chapterIdQuery.ilike('location', `%, ${state}`);
        }
        
        if (graduationYear && graduationYear !== 'All Years') {
          if (graduationYear === 'older') {
            chapterNameQuery = chapterNameQuery.lte('graduation_year', 2019);
            chapterIdQuery = chapterIdQuery.lte('graduation_year', 2019);
          } else {
            chapterNameQuery = chapterNameQuery.eq('graduation_year', parseInt(graduationYear));
            chapterIdQuery = chapterIdQuery.eq('graduation_year', parseInt(graduationYear));
          }
        }
        
        if (activelyHiring) {
          chapterNameQuery = chapterNameQuery.eq('is_actively_hiring', true);
          chapterIdQuery = chapterIdQuery.eq('is_actively_hiring', true);
        }
        
        // Apply pagination to both queries
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        chapterNameQuery = chapterNameQuery.range(from, to).order('created_at', { ascending: false });
        chapterIdQuery = chapterIdQuery.range(from, to).order('created_at', { ascending: false });
        
        // Execute both queries and combine results
        const [chapterNameResult, chapterIdResult] = await Promise.all([
          chapterNameQuery,
          chapterIdQuery
        ]);
        
        // Combine and deduplicate results
        const combinedResults = [
          ...(chapterNameResult.data || []),
          ...(chapterIdResult.data || [])
        ];
        
        // Remove duplicates based on id
        const uniqueResults = combinedResults.filter((alumni, index, self) => 
          index === self.findIndex(a => a.id === alumni.id)
        );
        
        console.log(`🔍 Found ${uniqueResults.length} alumni for chapter: ${userChapter} (ID: ${chapterId})`);
        
        // Transform data to match your interface
        const transformedAlumni = uniqueResults?.map(alumni => ({
          id: alumni.user_id || alumni.id,
          alumniId: alumni.id,
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
          mutualConnections: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections : [],
          mutualConnectionsCount: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections.length : 0,
          avatar: alumni.avatar_url || alumni.profile?.avatar_url,
          verified: alumni.verified,
          isActivelyHiring: alumni.is_actively_hiring,
          lastContact: alumni.last_contact,
          tags: alumni.tags || [],
          hasProfile: !!alumni.user_id
        })) || [];

        return NextResponse.json({
          alumni: transformedAlumni,
          total: transformedAlumni.length,
          page,
          limit,
          message: `Retrieved ${transformedAlumni.length} alumni records`
        });
      } else {
        // Fallback: just filter by chapter name
        query = query.eq('chapter', userChapter);
        console.log(`🔍 Filtering by user's chapter name only: ${userChapter}`);
      }
    } else if (chapter) {
      const chapterId = await getChapterId(supabase, chapter);
      if (chapterId) {
        // Similar logic for selected chapter filter - apply ALL filters
        let chapterNameQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url
            )
          `)
          .eq('chapter', chapter);
        
        let chapterIdQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url
            )
          `)
          .eq('chapter_id', chapterId);
        
        // Apply all other filters to both queries (same logic as above)
        if (search) {
          const searchTerm = search.toLowerCase().trim()
          const searchTerms = searchTerm.split(/\s+/)
          const searchConditions = searchTerms.map(term => 
            `full_name.ilike.%${term}%,company.ilike.%${term}%,job_title.ilike.%${term}%,industry.ilike.%${term}%,chapter.ilike.%${term}%`
          ).join(',')
          
          chapterNameQuery = chapterNameQuery.or(searchConditions);
          chapterIdQuery = chapterIdQuery.or(searchConditions);
        }
        
        if (industry) {
          chapterNameQuery = chapterNameQuery.eq('industry', industry);
          chapterIdQuery = chapterIdQuery.eq('industry', industry);
        }
        
        if (location) {
          chapterNameQuery = chapterNameQuery.eq('location', location);
          chapterIdQuery = chapterIdQuery.eq('location', location);
        }
        
        if (state) {
          chapterNameQuery = chapterNameQuery.ilike('location', `%, ${state}`);
          chapterIdQuery = chapterIdQuery.ilike('location', `%, ${state}`);
        }
        
        if (graduationYear && graduationYear !== 'All Years') {
          if (graduationYear === 'older') {
            chapterNameQuery = chapterNameQuery.lte('graduation_year', 2019);
            chapterIdQuery = chapterIdQuery.lte('graduation_year', 2019);
          } else {
            chapterNameQuery = chapterNameQuery.eq('graduation_year', parseInt(graduationYear));
            chapterIdQuery = chapterIdQuery.eq('graduation_year', parseInt(graduationYear));
          }
        }
        
        if (activelyHiring) {
          chapterNameQuery = chapterNameQuery.eq('is_actively_hiring', true);
          chapterIdQuery = chapterIdQuery.eq('is_actively_hiring', true);
        }
        
        // Apply pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        chapterNameQuery = chapterNameQuery.range(from, to).order('created_at', { ascending: false });
        chapterIdQuery = chapterIdQuery.range(from, to).order('created_at', { ascending: false });
        
        const [chapterNameResult, chapterIdResult] = await Promise.all([
          chapterNameQuery,
          chapterIdQuery
        ]);
        
        const combinedResults = [
          ...(chapterNameResult.data || []),
          ...(chapterIdResult.data || [])
        ];
        
        const uniqueResults = combinedResults.filter((alumni, index, self) => 
          index === self.findIndex(a => a.id === alumni.id)
        );
        
        console.log(`🔍 Found ${uniqueResults.length} alumni for selected chapter: ${chapter} (ID: ${chapterId})`);
        
        // Transform data to match your interface
        const transformedAlumni = uniqueResults?.map(alumni => ({
          id: alumni.user_id || alumni.id,
          alumniId: alumni.id,
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
          mutualConnections: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections : [],
          mutualConnectionsCount: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections.length : 0,
          avatar: alumni.avatar_url || alumni.profile?.avatar_url,
          verified: alumni.verified,
          isActivelyHiring: alumni.is_actively_hiring,
          lastContact: alumni.last_contact,
          tags: alumni.tags || [],
          hasProfile: !!alumni.user_id
        })) || [];

        return NextResponse.json({
          alumni: transformedAlumni,
          total: transformedAlumni.length,
          page,
          limit,
          message: `Retrieved ${transformedAlumni.length} alumni records`
        });
      } else {
        query = query.eq('chapter', chapter);
        console.log(`🔍 Filtering by selected chapter name only: ${chapter}`);
      }
    } else {
      console.log('🌍 No chapter filter applied - showing all chapters')
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
    
    console.log('🔍 Final query being executed...')

    const { data: alumni, error, count } = await query
      .range(from, to)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Supabase error:', error)
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

    console.log('✅ Query successful, alumni count:', alumni?.length || 0)
    if (alumni && alumni.length > 0) {
      console.log('📊 Sample alumni chapters:', alumni.slice(0, 3).map(a => a.chapter))
    }

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
      avatar: alumni.avatar_url || alumni.profile?.avatar_url,
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