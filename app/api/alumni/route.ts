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
    const showActiveOnly = searchParams.get('showActiveOnly') || '' // 🔥 NEW

    // Chapter filtering parameter
    const userChapter = searchParams.get('userChapter') || ''

    console.log('🔍 API Debug - Query params:', {
      page, limit, search, industry, chapter, location, graduationYear, 
      activelyHiring, state, activityStatus, showActiveOnly, userChapter // 🔥 UPDATED
    });

    // 🔥 KEY CHANGE: Use main branch query structure (alumni → profiles) with activity fields
    let query = supabase
      .from('alumni')
      .select(`
        *,
        profile:profiles!user_id(
          avatar_url,
          last_active_at,
          last_login_at
        )
      `, { count: 'exact' })

    // Apply filters (same logic as main branch)
    if (search) {
      const searchTerm = search.toLowerCase().trim()
      const searchTerms = searchTerm.split(/\s+/)
      const searchConditions = searchTerms.map(term => 
        `full_name.ilike.%${term}%,company.ilike.%${term}%,job_title.ilike.%${term}%,industry.ilike.%${term}%,chapter.ilike.%${term}%`
      ).join(',')
      
      query = query.or(searchConditions)
    }
    
    if (industry) {
      query = query.eq('industry', industry)
    }
    
    // Handle chapter filtering (same logic as main branch)
    if (userChapter) {
      const chapterId = await getChapterId(supabase, userChapter);
      if (chapterId) {
        let chapterNameQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url,
              last_active_at,
              last_login_at
            )
          `, { count: 'exact' })
          .eq('chapter', userChapter);
        
        let chapterIdQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url,
              last_active_at,
              last_login_at
            )
          `, { count: 'exact' })
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
        
        // Calculate total count
        const totalCount = Math.max(chapterNameResult.count || 0, chapterIdResult.count || 0);
        
        // 🔥 KEY CHANGE: Use main branch transformation with activity fields
        const transformedAlumni = uniqueResults?.map(alumni => ({
          id: alumni.user_id || alumni.id,
          alumniId: alumni.id,
          firstName: alumni.first_name,
          lastName: alumni.last_name,
          fullName: alumni.full_name,
          chapter: alumni.chapter,
          industry: alumni.industry,                    // ✅ Direct from alumni table
          graduationYear: alumni.graduation_year,
          company: alumni.company,                      // ✅ Direct from alumni table
          jobTitle: alumni.job_title,                   // ✅ Direct from alumni table
          email: alumni.email,
          phone: alumni.phone,
          location: alumni.location,                    // ✅ Direct from alumni table
          description: alumni.description || `Experienced professional in ${alumni.industry}.`,
          mutualConnections: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections : [],
          mutualConnectionsCount: Array.isArray(alumni.mutual_connections) ? alumni.mutual_connections.length : 0,
          avatar: alumni.avatar_url || alumni.profile?.avatar_url,
          verified: alumni.verified,
          isActivelyHiring: alumni.is_actively_hiring,  // ✅ Direct from alumni table
          lastContact: alumni.last_contact,
          tags: alumni.tags || [],
          hasProfile: !!alumni.user_id,
          // 🔥 NEW: Activity data from profiles table
          lastActiveAt: alumni.profile?.last_active_at,
          lastLoginAt: alumni.profile?.last_login_at
        })) || [];

        // 🔥 ADD: Activity filtering and sorting logic
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
        }

        // 🔥 ADD: Activity sorting logic
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

        // 🔥 NEW: Apply showActiveOnly filter
        if (showActiveOnly) {
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          filteredAlumni = filteredAlumni.filter(alumni => {
            if (!alumni.lastActiveAt) {
              return false // Exclude alumni with no activity data
            }

            const lastActiveDate = new Date(alumni.lastActiveAt)
            return lastActiveDate >= oneDayAgo // Only show alumni active within last 24 hours
          })
        }

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
          alumni: filteredAlumni,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          message: `Retrieved ${filteredAlumni.length} alumni records (page ${page} of ${totalPages})`
        });
      } else {
        query = query.eq('chapter', userChapter);
      }
    } else if (chapter) {
      const chapterId = await getChapterId(supabase, chapter);
      if (chapterId) {
        // Similar logic for selected chapter filter
        let chapterNameQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url,
              last_active_at,
              last_login_at
            )
          `, { count: 'exact' })
          .eq('chapter', chapter);
        
        let chapterIdQuery = supabase
          .from('alumni')
          .select(`
            *,
            profile:profiles!user_id(
              avatar_url,
              last_active_at,
              last_login_at
            )
          `, { count: 'exact' })
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
        
        // Apply pagination to both queries
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
        
        const totalCount = Math.max(chapterNameResult.count || 0, chapterIdResult.count || 0);
        
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
          hasProfile: !!alumni.user_id,
          // Activity data from profiles table
          lastActiveAt: alumni.profile?.last_active_at,
          lastLoginAt: alumni.profile?.last_login_at
        })) || [];

        // Apply activity filtering and sorting logic
        let filteredAlumni = transformedAlumni

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
        }

        // Activity sorting logic
        filteredAlumni.sort((a, b) => {
          const aActive = a.lastActiveAt ? new Date(a.lastActiveAt) : null
          const bActive = b.lastActiveAt ? new Date(b.lastActiveAt) : null
          const now = new Date()
          
          const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          const getActivityPriority = (lastActive: Date | null) => {
            if (!lastActive) return 4
            if (lastActive >= oneHourAgo) return 1
            if (lastActive >= oneDayAgo) return 2
            return 3
          }
          
          const aPriority = getActivityPriority(aActive)
          const bPriority = getActivityPriority(bActive)
          
          if (aPriority !== bPriority) {
            return aPriority - bPriority
          }
          
          if (aActive && bActive) {
            return bActive.getTime() - aActive.getTime()
          }
          
          if (aActive && !bActive) return -1
          if (!aActive && bActive) return 1
          
          return a.fullName.localeCompare(b.fullName)
        })

        // 🔥 NEW: Apply showActiveOnly filter
        if (showActiveOnly) {
          const now = new Date()
          const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          
          filteredAlumni = filteredAlumni.filter(alumni => {
            if (!alumni.lastActiveAt) {
              return false // Exclude alumni with no activity data
            }

            const lastActiveDate = new Date(alumni.lastActiveAt)
            return lastActiveDate >= oneDayAgo // Only show alumni active within last 24 hours
          })
        }

        const totalPages = Math.ceil(totalCount / limit);

        return NextResponse.json({
          alumni: filteredAlumni,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          },
          message: `Retrieved ${filteredAlumni.length} alumni records (page ${page} of ${totalPages})`
        });
      } else {
        query = query.eq('chapter', chapter);
      }
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
    
    query = query.range(from, to).order('created_at', { ascending: false })

    const { data: alumni, error, count } = await query

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ 
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    // 🔥 KEY CHANGE: Use main branch transformation with activity fields
    const transformedAlumni = alumni?.map(alumni => ({
      id: alumni.user_id || alumni.id,
      alumniId: alumni.id,
      firstName: alumni.first_name,
      lastName: alumni.last_name,
      fullName: alumni.full_name,
      chapter: alumni.chapter,
      industry: alumni.industry,                    // ✅ Direct from alumni table
      graduationYear: alumni.graduation_year,
      company: alumni.company,                      // ✅ Direct from alumni table
      jobTitle: alumni.job_title,                   // ✅ Direct from alumni table
      email: alumni.email,
      phone: alumni.phone,
      location: alumni.location,                    // ✅ Direct from alumni table
      description: alumni.description || `Experienced professional in ${alumni.industry}.`,
      mutualConnections: alumni.mutual_connections || [],
      mutualConnectionsCount: alumni.mutual_connections?.length || 0,
      avatar: alumni.avatar_url || alumni.profile?.avatar_url,
      verified: alumni.verified,
      isActivelyHiring: alumni.is_actively_hiring,  // ✅ Direct from alumni table
      lastContact: alumni.last_contact,
      tags: alumni.tags || [],
      hasProfile: !!alumni.user_id,
      // 🔥 NEW: Activity data from profiles table
      lastActiveAt: alumni.profile?.last_active_at,
      lastLoginAt: alumni.profile?.last_login_at
    })) || []

    // 🔍 TEMPORARY DEBUG - Add this after line 418
    console.log('🔍 API Debug - Alumni data sample:', {
      totalAlumni: transformedAlumni.length,
      sampleAlumni: transformedAlumni.slice(0, 3).map(a => ({
        name: a.fullName,
        lastActiveAt: a.lastActiveAt,
        hasProfile: a.hasProfile
      }))
    });

    //  ADD: Activity filtering and sorting logic
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
    }

    // 🔥 ADD: Activity sorting logic
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

    // 🔥 NEW: Apply showActiveOnly filter
    if (showActiveOnly) {
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      
      filteredAlumni = filteredAlumni.filter(alumni => {
        if (!alumni.lastActiveAt) {
          return false // Exclude alumni with no activity data
        }

        const lastActiveDate = new Date(alumni.lastActiveAt)
        return lastActiveDate >= oneDayAgo // Only show alumni active within last 24 hours
      })
    }

    const totalPages = Math.ceil((count || 0) / limit);

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