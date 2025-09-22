import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
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
    const limit = parseInt(searchParams.get('limit') || '100')
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const chapter = searchParams.get('chapter') || ''
    const location = searchParams.get('location') || ''
    const graduationYear = searchParams.get('graduationYear') || ''
    const activelyHiring = searchParams.get('activelyHiring') || ''
    const state = searchParams.get('state') || ''
    const activityStatus = searchParams.get('activityStatus') || ''
    
    // Chapter filtering parameter
    const userChapter = searchParams.get('userChapter') || ''

    console.log('🔍 API Debug - Query params:', {
      page, limit, search, industry, chapter, location, graduationYear, 
      activelyHiring, state, activityStatus, userChapter
    });

    // Build the query - Query profiles table first, join alumni data
    let query = supabase
      .from('profiles')
      .select(`
        *,
        alumni!user_id(
          first_name,
          last_name,
          full_name,
          chapter,
          industry,
          graduation_year,
          company,
          job_title,
          email,
          phone,
          location,
          description,
          mutual_connections,
          avatar_url,
          verified,
          is_actively_hiring,
          last_contact,
          tags
        )
      `, { count: 'exact' })

    // Apply role filter to only get alumni
    query = query.eq('role', 'alumni')

    // Apply chapter filter FIRST (most important)
    if (userChapter) {
      console.log('🔍 Applying chapter filter:', userChapter);
      query = query.eq('chapter', userChapter);
    }

    // Apply other filters - need to check if alumni data exists for these filters
    if (search) {
      const searchTerm = search.toLowerCase().trim()
      const searchTerms = searchTerm.split(/\s+/)
      const searchConditions = searchTerms.map(term => 
        `full_name.ilike.%${term}%,alumni.company.ilike.%${term}%,alumni.job_title.ilike.%${term}%,alumni.industry.ilike.%${term}%,chapter.ilike.%${term}%`
      ).join(',')
      
      query = query.or(searchConditions)
    }
    
    if (industry) {
      query = query.eq('alumni.industry', industry)
    }
    
    if (location) {
      query = query.eq('alumni.location', location)
    }

    if (state) {
      query = query.ilike('alumni.location', `%, ${state}`)
    }
    
    if (graduationYear && graduationYear !== 'All Years') {
      if (graduationYear === 'older') {
        query = query.lte('alumni.graduation_year', 2019)
      } else {
        query = query.eq('alumni.graduation_year', parseInt(graduationYear))
      }
    } 
    
    if (activelyHiring) {
      query = query.eq('alumni.is_actively_hiring', true)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    // Sort by created_at first (we'll handle activity sorting in the frontend)
    query = query.range(from, to).order('created_at', { ascending: false })

    console.log('🔍 Executing query...');
    const { data: alumni, error, count } = await query

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('✅ Query successful:', {
      profilesCount: alumni?.length || 0,
      totalCount: count || 0,
      page,
      limit
    });

    // Transform data to match your interface
    const transformedAlumni = alumni?.map(profile => {
      const alumniData = profile.alumni?.[0] // Get first alumni record if exists
      
      return {
        id: profile.id,
        alumniId: alumniData?.id,
        firstName: alumniData?.first_name || profile.first_name,
        lastName: alumniData?.last_name || profile.last_name,
        fullName: alumniData?.full_name || profile.full_name,
        chapter: alumniData?.chapter || profile.chapter,
        industry: alumniData?.industry,
        graduationYear: alumniData?.graduation_year,
        company: alumniData?.company,
        jobTitle: alumniData?.job_title,
        email: alumniData?.email || profile.email,
        phone: alumniData?.phone || profile.phone,
        location: alumniData?.location || profile.location,
        description: alumniData?.description || `Experienced professional in ${alumniData?.industry || 'their field'}.`,
        mutualConnections: alumniData?.mutual_connections || [],
        mutualConnectionsCount: alumniData?.mutual_connections?.length || 0,
        avatar: alumniData?.avatar_url || profile.avatar_url,
        verified: alumniData?.verified,
        isActivelyHiring: alumniData?.is_actively_hiring,
        lastContact: alumniData?.last_contact,
        tags: alumniData?.tags || [],
        hasProfile: true, // All profiles have profiles by definition
        // Activity data - now from profiles table directly
        lastActiveAt: profile.last_active_at,
        lastLoginAt: profile.last_login_at
      }
    }) || []

    // 🔥 ACTIVITY FILTERING AND SORTING LOGIC
    let filteredAlumni = transformedAlumni

    // Apply activity status filter
    if (activityStatus) {
      const now = new Date()
      
      filteredAlumni = transformedAlumni.filter(alumni => {
        if (!alumni.lastActiveAt) {
          return activityStatus === 'cold'
        }

        const lastActiveDate = new Date(alumni.lastActiveAt)
        const diffMs = now.getTime() - lastActiveDate.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)

        switch (activityStatus) {
          case 'hot':
            return diffHours < 1
          case 'warm':
            return diffHours >= 1 && diffHours < 24
          case 'cold':
            return diffHours >= 24
          default:
            return true
        }
      })

      console.log(`🔍 Activity filter "${activityStatus}" applied:`, {
        originalCount: transformedAlumni.length,
        filteredCount: filteredAlumni.length,
        breakdown: {
          hot: transformedAlumni.filter(a => {
            if (!a.lastActiveAt) return false
            const diffHours = (new Date().getTime() - new Date(a.lastActiveAt).getTime()) / (1000 * 60 * 60)
            return diffHours < 1
          }).length,
          warm: transformedAlumni.filter(a => {
            if (!a.lastActiveAt) return false
            const diffHours = (new Date().getTime() - new Date(a.lastActiveAt).getTime()) / (1000 * 60 * 60)
            return diffHours >= 1 && diffHours < 24
          }).length,
          cold: transformedAlumni.filter(a => {
            if (!a.lastActiveAt) return true
            const diffHours = (new Date().getTime() - new Date(a.lastActiveAt).getTime()) / (1000 * 60 * 60)
            return diffHours >= 24
          }).length
        }
      })
    }

    // 🔥 ACTIVITY SORTING LOGIC - This is the key part!
    filteredAlumni.sort((a, b) => {
      const aActive = a.lastActiveAt ? new Date(a.lastActiveAt) : null
      const bActive = b.lastActiveAt ? new Date(b.lastActiveAt) : null
      const now = new Date()
      
      // Define activity thresholds
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      // Helper function to get activity priority (lower number = higher priority)
      const getActivityPriority = (lastActive: Date | null) => {
        if (!lastActive) return 4 // No activity - lowest priority
        if (lastActive >= oneHourAgo) return 1 // Active within 1 hour - highest priority
        if (lastActive >= oneDayAgo) return 2 // Active within 24 hours - medium priority
        return 3 // Active but older than 24 hours - low priority
      }
      
      const aPriority = getActivityPriority(aActive)
      const bPriority = getActivityPriority(bActive)
      
      // First sort by activity priority
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }
      
      // If same priority, sort by most recent activity
      if (aActive && bActive) {
        return bActive.getTime() - aActive.getTime()
      }
      
      // If only one has activity, prioritize it
      if (aActive && !bActive) return -1
      if (!aActive && bActive) return 1
      
      // If neither has activity, sort by name
      return a.fullName.localeCompare(b.fullName)
    })

    const totalPages = Math.ceil((count || 0) / limit);

    console.log('📊 Final result with activity filtering and sorting:', {
      transformedCount: filteredAlumni.length,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      activityBreakdown: {
        activeNow: filteredAlumni.filter(a => {
          if (!a.lastActiveAt) return false
          const lastActive = new Date(a.lastActiveAt)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
          return lastActive >= oneHourAgo
        }).length,
        recentlyActive: filteredAlumni.filter(a => {
          if (!a.lastActiveAt) return false
          const lastActive = new Date(a.lastActiveAt)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
          return lastActive >= oneDayAgo && lastActive < oneHourAgo
        }).length,
        inactive: filteredAlumni.filter(a => !a.lastActiveAt || (() => {
          const lastActive = new Date(a.lastActiveAt!)
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
          return lastActive < oneDayAgo
        })()).length
      }
    });

    return NextResponse.json({
      alumni: filteredAlumni,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      message: `Retrieved ${filteredAlumni.length} alumni records (page ${page} of ${totalPages})`
    })

  } catch (error) {
    console.error('API Route error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}