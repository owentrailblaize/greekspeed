'use client';

import { useCallback, useMemo } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
  type QueryFunctionContext,
} from '@tanstack/react-query';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Post, PostsResponse, CreatePostRequest } from '@/types/posts';

interface InitialFeedData extends PostsResponse {
  chapterId: string;
}

interface UsePostsOptions {
  initialData?: InitialFeedData;
  pageSize?: number;
}

type PostsQueryKey = ['posts', string, number];

const EMPTY_RESPONSE: PostsResponse = {
  posts: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

export function usePosts(chapterId: string, options: UsePostsOptions = {}) {
  const { user, session, getAuthHeaders } = useAuth();
  const queryClient = useQueryClient();

  const normalizedInitialData = useMemo(() => {
    if (!options.initialData) return undefined;
    if (!chapterId) return options.initialData;
    return options.initialData.chapterId === chapterId ? options.initialData : undefined;
  }, [chapterId, options.initialData]);

  const pageSize = Math.min(Math.max(options.pageSize ?? 10, 1), 50);
  const queryKey = useMemo<PostsQueryKey>(() => ['posts', chapterId, pageSize], [chapterId, pageSize]);
  const enabled = Boolean(user && session && chapterId);

  const fetchPage = useCallback(
    async ({ pageParam = 1 }: QueryFunctionContext<PostsQueryKey, number>) => {
      if (!session || !chapterId) {
        return EMPTY_RESPONSE;
      }

      const headers = getAuthHeaders();
      const response = await fetch(
        `/api/posts?chapterId=${chapterId}&page=${pageParam}&limit=${pageSize}`,
        {
          headers,
        },
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Failed to fetch posts');
      }

      const data: PostsResponse = await response.json();
      return data;
    },
    [chapterId, getAuthHeaders, session, pageSize],
  );

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isInitialLoading,
    isRefetching,
  } = useInfiniteQuery<PostsResponse, Error, InfiniteData<PostsResponse, number>, PostsQueryKey, number>({
    queryKey,
    queryFn: fetchPage,
    enabled,
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialData: normalizedInitialData
      ? {
          pages: [normalizedInitialData],
          pageParams: [1],
        }
      : undefined,
  });

  const posts = useMemo(() => {
    const pages = data?.pages ?? [];
    return pages.flatMap((page) => page.posts);
  }, [data]);

  const updateCachedPages = useCallback(
    (updater: (pages: PostsResponse[]) => PostsResponse[]) => {
      queryClient.setQueryData<InfiniteData<PostsResponse>>(queryKey, (existing) => {
        if (!existing) return existing;
        const updatedPages = updater(existing.pages);
        return {
          ...existing,
          pages: updatedPages,
        };
      });
    },
    [queryClient, queryKey],
  );

  const createPost = useCallback(
    async (postData: CreatePostRequest) => {
      if (!user || !chapterId || !session) return null;

      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      };

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers,
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Failed to create post');
      }

      const { post } = await response.json();

      updateCachedPages((pages) => {
        if (pages.length === 0) {
          return [
            {
              ...EMPTY_RESPONSE,
              posts: [post],
            },
          ];
        }

        const [first, ...rest] = pages;
        const updatedFirst: PostsResponse = {
          ...first,
          posts: [post, ...first.posts],
          pagination: {
            ...first.pagination,
            total: first.pagination.total + 1,
          },
        };

        return [updatedFirst, ...rest];
      });

      return post;
    },
    [chapterId, getAuthHeaders, session, updateCachedPages, user],
  );

  const likePost = useCallback(
    async (postId: string) => {
      if (!user || !session) return;

      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Failed to like post');
      }

      const { liked } = await response.json();

      updateCachedPages((pages) =>
        pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  is_liked: liked,
                  likes_count: liked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
                }
              : post,
          ),
        })),
      );
    },
    [getAuthHeaders, session, updateCachedPages, user],
  );

  const deletePost = useCallback(
    async (postId: string) => {
      if (!user || !session) return false;

      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? 'Failed to delete post');
      }

      updateCachedPages((pages) =>
        pages.map((page) => ({
          ...page,
          posts: page.posts.filter((post) => post.id !== postId),
          pagination: {
            ...page.pagination,
            total: Math.max(
              0,
              page.pagination.total -
                (page.posts.some((post) => post.id === postId) ? 1 : 0),
            ),
          },
        })),
      );

      return true;
    },
    [getAuthHeaders, session, updateCachedPages, user],
  );

  const refresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey }),
    [queryClient, queryKey],
  );

  return {
    posts,
    error: error?.message ?? null,
    isInitialLoading,
    isLoading: isLoading || isRefetching,
    isRefetching,
    isFetchingNextPage,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    refresh,
    createPost,
    likePost,
    deletePost,
  };
}
