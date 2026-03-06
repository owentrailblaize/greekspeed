import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/posts/[id]/image
 * Returns image_url and image_urls for a single post. Used when the feed
 * omits image data (slim feed) and the client needs to load it on demand.
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

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('chapter_id, is_developer')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('chapter_id, image_url, metadata')
      .eq('id', postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const isDeveloper = profile.is_developer === true;
    if (!isDeveloper && profile.chapter_id !== post.chapter_id) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this post' },
        { status: 403 }
      );
    }

    const metadata = post.metadata as { image_urls?: string[] } | null | undefined;
    const image_urls = Array.isArray(metadata?.image_urls) && metadata.image_urls.length > 0
      ? metadata.image_urls
      : post.image_url
        ? [post.image_url]
        : undefined;

    return NextResponse.json({
      image_url: post.image_url ?? null,
      image_urls: image_urls ?? undefined,
    });
  } catch (error) {
    console.error('Post image API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
