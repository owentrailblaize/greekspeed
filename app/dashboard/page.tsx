export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import DashboardPageClient from './DashboardPageClient';
import type { Post, PostsResponse } from '@/types/posts';

const POSTS_PAGE_LIMIT = 20;

export default async function DashboardPage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...(options ?? {}) });
        },
        remove(name: string, options: any) {
          cookieStore.delete({ name, ...(options ?? {}) });
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return <DashboardPageClient />;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      `
        id,
        chapter_id,
        role,
        welcome_seen,
        chapter,
        role_display,
        first_name,
        last_name
      `,
    )
    .eq('id', session.user.id)
    .maybeSingle();

  let initialFeed:
    | (PostsResponse & {
        chapterId: string;
      })
    | null = null;

  if (profile?.chapter_id) {
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(
        `
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
        `,
      )
      .eq('chapter_id', profile.chapter_id)
      .order('created_at', { ascending: false })
      .range(0, POSTS_PAGE_LIMIT - 1);

    if (!postsError && posts) {
      const { data: userLikes } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', session.user.id);

      const likedPostIds = new Set(userLikes?.map((like) => like.post_id) ?? []);

      const transformedPosts: Post[] = posts.map((post) => ({
        ...post,
        is_liked: likedPostIds.has(post.id),
        is_author: post.author_id === session.user.id,
        likes_count: post.likes_count ?? 0,
        comments_count: post.comments_count ?? 0,
        shares_count: post.shares_count ?? 0,
      }));

      const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', profile.chapter_id);

      initialFeed = {
        posts: transformedPosts,
        pagination: {
          page: 1,
          limit: POSTS_PAGE_LIMIT,
          total: totalCount ?? transformedPosts.length,
          totalPages: Math.ceil((totalCount ?? transformedPosts.length) / POSTS_PAGE_LIMIT),
        },
        chapterId: profile.chapter_id,
      };
    }
  }

  return (
    <DashboardPageClient
      initialFeed={initialFeed ?? undefined}
      fallbackChapterId={profile?.chapter_id ?? null}
    />
  );
}