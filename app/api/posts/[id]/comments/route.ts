import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Check if post exists and user has access to it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('chapter_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is in the same chapter
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.chapter_id !== post.chapter_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Fetch comments with author information and like status
    const { data: comments, error } = await supabase
      .from('post_comments')
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Comments fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    // Check which comments the current user has liked
    if (comments && comments.length > 0) {
      const commentIds = comments.map(comment => comment.id);
      const { data: userLikes, error: likesError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in('comment_id', commentIds);

      if (!likesError && userLikes) {
        const likedCommentIds = new Set(userLikes.map(like => like.comment_id));
        comments.forEach(comment => {
          comment.is_liked = likedCommentIds.has(comment.id);
        });
      }
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('post_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    return NextResponse.json({
      comments: comments || [],
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: postId } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
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

    // Check if post exists and user has access to it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('chapter_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user is in the same chapter
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.chapter_id !== post.chapter_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create comment
    const { data: comment, error: createError } = await supabase
      .from('post_comments')
      .insert({
        post_id: postId,
        author_id: user.id,
        content: content.trim()
      })
      .select(`
        *,
        author:profiles!author_id(
          id,
          full_name,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single();

    if (createError) {
      console.error('Comment creation error:', createError);
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
