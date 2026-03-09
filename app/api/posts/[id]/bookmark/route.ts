import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/posts/[id]/bookmark
 * Returns whether the current user has bookmarked this post.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: post } = await supabase
      .from('posts')
      .select('id, chapter_id')
      .eq('id', postId)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('chapter_id, is_developer')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canAccess = profile.is_developer === true || profile.chapter_id === post.chapter_id;
    if (!canAccess) {
      return NextResponse.json({ error: 'Cannot access this post' }, { status: 403 });
    }

    const { data: bookmark } = await supabase
      .from('post_bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({ bookmarked: !!bookmark });
  } catch (error) {
    console.error('Bookmark GET API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/posts/[id]/bookmark
 * Toggle bookmark: insert if not bookmarked, delete if bookmarked. Returns { bookmarked: boolean }.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, chapter_id')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('chapter_id, is_developer')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const canAccess = profile.is_developer === true || profile.chapter_id === post.chapter_id;
    if (!canAccess) {
      return NextResponse.json({ error: 'Cannot bookmark posts from other chapters' }, { status: 403 });
    }

    const { data: existing } = await supabase
      .from('post_bookmarks')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const { error: deleteError } = await supabase
        .from('post_bookmarks')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Bookmark delete error:', deleteError);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
      }
      return NextResponse.json({ bookmarked: false });
    }

    const { error: insertError } = await supabase.from('post_bookmarks').insert({
      post_id: postId,
      user_id: user.id,
    });

    if (insertError) {
      console.error('Bookmark insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 });
    }
    return NextResponse.json({ bookmarked: true });
  } catch (error) {
    console.error('Bookmark POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
