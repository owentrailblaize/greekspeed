import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { fetchUserProfileBySlug } from '@/lib/services/userProfileService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Fetch profile by slug to get chapter_id
    const profile = await fetchUserProfileBySlug(slug);
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get viewer ID (optional)
    let viewerId: string | null = null;
    try {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return cookieStore.get(name)?.value;
            },
            set() {},
            remove() {},
          },
        }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        viewerId = user.id;
      }
    } catch (authError) {
      // Continue without viewer
    }

    // Get profiles from same chapter (exclude current profile)
    let fromSameChapter: any[] = [];
    if (profile.chapter_id) {
      const { data: chapterProfiles } = await supabaseService
        .from('profiles')
        .select('id, full_name, first_name, last_name, avatar_url, chapter, profile_slug, username')
        .eq('chapter_id', profile.chapter_id)
        .neq('id', profile.id)
        .not('profile_slug', 'is', null)
        .limit(10);

      if (chapterProfiles) {
        fromSameChapter = chapterProfiles;
      }
    }

    // Get mutual connections if viewer is logged in
    let mutualConnections: any[] = [];
    if (viewerId && viewerId !== profile.id) {
      // Get viewer's connections
      const { data: viewerConnections } = await supabaseService
        .from('connections')
        .select('requester_id, recipient_id')
        .or(`requester_id.eq.${viewerId},recipient_id.eq.${viewerId}`)
        .eq('status', 'accepted');

      if (viewerConnections && viewerConnections.length > 0) {
        const viewerConnectionIds = new Set(
          viewerConnections.map(conn => 
            conn.requester_id === viewerId ? conn.recipient_id : conn.requester_id
          )
        );

        // Get profile's connections
        const { data: profileConnections } = await supabaseService
          .from('connections')
          .select('requester_id, recipient_id')
          .or(`requester_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
          .eq('status', 'accepted');

        if (profileConnections && profileConnections.length > 0) {
          const profileConnectionIds = new Set(
            profileConnections.map(conn => 
              conn.requester_id === profile.id ? conn.recipient_id : conn.requester_id
            )
          );

          // Find mutual connections
          const mutualIds = Array.from(viewerConnectionIds).filter(id => 
            profileConnectionIds.has(id)
          );

          if (mutualIds.length > 0) {
            const { data: mutualProfiles } = await supabaseService
              .from('profiles')
              .select('id, full_name, first_name, last_name, avatar_url, chapter, profile_slug, username')
              .in('id', mutualIds)
              .not('profile_slug', 'is', null)
              .limit(10);

            if (mutualProfiles) {
              mutualConnections = mutualProfiles;
            }
          }
        }
      }
    }

    // Remove duplicates and exclude profiles already in fromSameChapter
    const chapterIds = new Set(fromSameChapter.map(p => p.id));
    const filteredMutual = mutualConnections.filter(p => !chapterIds.has(p.id));

    return NextResponse.json({
      similar: [...fromSameChapter, ...filteredMutual].slice(0, 20),
      fromSameChapter,
      mutualConnections: filteredMutual,
    });
  } catch (error) {
    console.error('Similar connections API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

