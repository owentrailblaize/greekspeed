import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logger } from "@/lib/utils/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { id: postId, commentId } = await params;

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

    // Check if comment exists and user has access to it
    const { data: comment, error: commentError } = await supabase
      .from('post_comments')
      .select('id, post_id')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if post exists and user has access to it
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('chapter_id')
      .eq('id', comment.post_id)
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

    // Check if user already liked the comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('comment_likes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike the comment
      const { error: unlikeError } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (unlikeError) {
        logger.error('Comment unlike error:', { context: [unlikeError] });
        return NextResponse.json({ error: 'Failed to unlike comment' }, { status: 500 });
      }

      return NextResponse.json({ liked: false });
    } else {
      // Like the comment
      const { error: likeError } = await supabase
        .from('comment_likes')
        .insert({
          comment_id: commentId,
          user_id: user.id
        });

      if (likeError) {
        logger.error('Comment like error:', { context: [likeError] });
        return NextResponse.json({ error: 'Failed to like comment' }, { status: 500 });
      }

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    logger.error('API error:', { context: [error] });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
