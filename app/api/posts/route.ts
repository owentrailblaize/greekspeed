import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchLinkPreviewsServer } from '@/lib/services/linkPreviewService';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    const page = parseInt(searchParams.get('page') || '1');
    const requestedLimit = parseInt(searchParams.get('limit') || '10');
    const limit = Math.min(Math.max(requestedLimit, 1), 50);

    if (!chapterId) {
      return NextResponse.json({ error: 'Chapter ID required' }, { status: 400 });
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch posts with author information
    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url,
          chapter_role,
          member_status
        ),
        comments_preview:post_comments(
          id,
          post_id,
          author_id,
          content,
          likes_count,
          created_at,
          updated_at,
          author:profiles!post_comments_author_id_fkey(
            id,
            full_name,
            first_name,
            last_name,
            avatar_url
          )
        )
      `)
      .eq('chapter_id', chapterId)
      .order('created_at', { ascending: false })
      .order('created_at', { ascending: false, foreignTable: 'post_comments' })
      .limit(2, { foreignTable: 'post_comments' })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Posts fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Check which posts the current user has liked
    const { data: userLikes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id);

    if (likesError) {
      console.error('Likes fetch error:', likesError);
    }

    const likedPostIds = new Set(userLikes?.map(like => like.post_id) || []);

    // Transform the data to include like status and author info
    const transformedPosts = posts?.map(post => {
      const preview = Array.isArray(post.comments_preview)
        ? [...post.comments_preview]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 2)
        : [];

      return {
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_author: post.author_id === user.id,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || preview.length,
        shares_count: post.shares_count || 0,
        comments_preview: preview
      };
    }) || [];

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('chapter_id', chapterId);

    // The posts payload includes `comments_count` and a lightweight `comments_preview`
    // array so the client feed can render comment metadata without triggering the full
    // comments API upfront.
    return NextResponse.json({
      posts: transformedPosts,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await request.json();
    const { content, post_type, image_url, metadata } = body;

    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile to verify chapter
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.chapter_id) {
      return NextResponse.json({ error: 'User not associated with a chapter' }, { status: 400 });
    }

    // Check if user has permission to create posts
    const allowedRoles = ['admin', 'alumni', 'active_member'];
    if (!profile.role || !allowedRoles.includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Validate post type
    if (post_type === 'image' && !image_url) {
      return NextResponse.json({ error: 'Image URL required for image posts' }, { status: 400 });
    }

    if (post_type === 'text' && !content.trim()) {
      return NextResponse.json({ error: 'Content required for text posts' }, { status: 400 });
    }

    // Extract URLs and fetch link previews (don't block post creation if this fails)
    let linkPreviews: any[] = [];
    if (content) {
      try {
        const previewResults = await fetchLinkPreviewsServer(content);
        linkPreviews = previewResults
          .filter(result => result.preview)
          .map(result => result.preview);
      } catch (error) {
        console.error('Error fetching link previews:', error);
        // Continue without previews - don't block post creation
      }
    }

    // Update metadata to include link previews
    const finalMetadata = {
      ...(metadata || {}),
      ...(linkPreviews.length > 0 ? { link_previews: linkPreviews } : {}),
    };

    // Create post
    const { data: post, error: createError } = await supabase
      .from('posts')
      .insert({
        chapter_id: profile.chapter_id,
        author_id: user.id,
        content: content?.trim() || '',
        post_type,
        image_url: image_url || null,
        metadata: finalMetadata,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0
      })
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url,
          chapter_role,
          member_status
        )
      `)
      .single();

    if (createError) {
      console.error('Post creation error:', createError);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    return NextResponse.json({
      post: {
        ...post,
        comments_count: post?.comments_count || 0,
        comments_preview: []
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
