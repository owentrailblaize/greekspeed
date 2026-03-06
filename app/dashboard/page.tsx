export const dynamic = 'force-dynamic';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import DashboardPageClient from './DashboardPageClient';
import type { Post, PostsResponse } from '@/types/posts';
import type { Profile } from '@/types/profile';

const POSTS_PAGE_LIMIT = 10;

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

  // Fetch the FULL profile — used both for server rendering gates AND
  // to hydrate ProfileContext on the client, eliminating the duplicate fetch.
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')  // Was: specific fields only
    .eq('id', session.user.id)
    .maybeSingle();

  // Cast to Profile (Supabase returns matching shape from SELECT *)
  const serverProfile: Profile | null = profile ?? null;

  let initialFeed:
    | (PostsResponse & {
        chapterId: string;
      })
    | null = null;

  if (profile?.chapter_id) {
    try {
      // ---------------------------------------------------------------------------
      // Run posts, likes, and count queries IN PARALLEL (saves ~200-400ms)
      // ---------------------------------------------------------------------------
      const [postsResult, likesResult, countResult] = await Promise.all([
        supabase
          .from('posts')
          .select(
            `
              id,
              chapter_id,
              author_id,
              content,
              post_type,
              image_url,
              likes_count,
              comments_count,
              shares_count,
              created_at,
              updated_at,
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
          .range(0, POSTS_PAGE_LIMIT - 1),

        supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', session.user.id),

        supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('chapter_id', profile.chapter_id),
      ]);

      const { data: posts, error: postsError } = postsResult;
      const { data: userLikes } = likesResult;
      const { count: totalCount } = countResult;

      if (!postsError && posts) {
        const likedPostIds = new Set(userLikes?.map((like) => like.post_id) ?? []);

        const transformedPosts: Post[] = posts.map((post) => {
          // Normalize author - Supabase may return it as an array even for one-to-one relationships
          const author = Array.isArray(post.author) 
            ? post.author[0] || null
            : post.author || null;

          return {
            ...post,
            author,
            is_liked: likedPostIds.has(post.id),
            is_author: post.author_id === session.user.id,
            likes_count: post.likes_count ?? 0,
            comments_count: post.comments_count ?? 0,
            shares_count: post.shares_count ?? 0,
            // No comments_preview - will be loaded on-demand
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
      } else {
        // Even on error, provide empty feed structure to prevent skeleton loader
        console.error('[DashboardPage] Error fetching posts:', postsError);
        initialFeed = {
          posts: [],
          pagination: {
            page: 1,
            limit: POSTS_PAGE_LIMIT,
            total: 0,
            totalPages: 0,
          },
          chapterId: profile.chapter_id,
        };
      }
    } catch (error) {
      // On any error, still provide empty structure to prevent skeleton loader
      console.error('[DashboardPage] Exception fetching initial feed:', error);
      initialFeed = {
        posts: [],
        pagination: {
          page: 1,
          limit: POSTS_PAGE_LIMIT,
          total: 0,
          totalPages: 0,
        },
        chapterId: profile.chapter_id,
      };
    }
  }

  return (
    <DashboardPageClient
      initialFeed={initialFeed ?? undefined}
      fallbackChapterId={profile?.chapter_id ?? null}
      serverProfile={serverProfile}
    />
  );
}