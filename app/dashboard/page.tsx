export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import DashboardPageClient from './DashboardPageClient';
import type { Post, PostsResponse } from '@/types/posts';

const POSTS_PAGE_LIMIT = 10; // Match client-side default (usePosts pageSize ?? 10)

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
        last_name,
        is_developer
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
    // Parallelize posts, likes, and count queries instead of running sequentially
    const [postsResult, likesResult, countResult] = await Promise.all([
      // Query 1: Posts with author + comments_preview (matches API route shape)
      supabase
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
          `,
        )
        .eq('chapter_id', profile.chapter_id)
        .order('created_at', { ascending: false })
        .order('created_at', { ascending: false, foreignTable: 'post_comments' })
        .limit(2, { foreignTable: 'post_comments' })
        .range(0, POSTS_PAGE_LIMIT - 1),

      // Query 2: User likes
      supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', session.user.id),

      // Query 3: Total count for pagination
      supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('chapter_id', profile.chapter_id),
    ]);

    const { data: posts, error: postsError } = postsResult;
    const { data: userLikes } = likesResult;
    const { count: totalCount } = countResult;

    if (!postsError && posts) {
      // Filter likes to only the displayed post IDs for efficiency
      const postIds = new Set(posts.map((p: any) => p.id));
      const likedPostIds = new Set(
        userLikes?.filter((like) => postIds.has(like.post_id)).map((like) => like.post_id) ?? [],
      );

      const transformedPosts: Post[] = posts.map((post: any) => {
        // Normalize author — Supabase may return it as an array for one-to-one relationships
        const author = Array.isArray(post.author)
          ? post.author[0] || null
          : post.author || null;

        // Normalize comment authors as well
        const preview = Array.isArray(post.comments_preview)
          ? [...post.comments_preview]
            .sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
            .slice(0, 2)
            .map((comment: any) => ({
              ...comment,
              author: Array.isArray(comment.author)
                ? comment.author[0] || null
                : comment.author || null,
            }))
          : [];

        return {
          ...post,
          author,
          is_liked: likedPostIds.has(post.id),
          is_author: post.author_id === session.user.id,
          likes_count: post.likes_count ?? 0,
          comments_count: post.comments_count ?? 0,
          shares_count: post.shares_count ?? 0,
          comments_preview: preview,
        };
      });

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
      serverProfile={
        profile
          ? {
              id: profile.id,
              role: profile.role as string | null,
              chapter_id: profile.chapter_id as string | null,
              chapter: profile.chapter as string | null,
              welcome_seen: !!profile.welcome_seen,
              first_name: (profile.first_name as string | null) ?? null,
              last_name: (profile.last_name as string | null) ?? null,
              is_developer: !!profile.is_developer,
            }
          : null
      }
    />
  );
}
