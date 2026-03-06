/**
 * TRA-383 — localStorage feed cache for instant return-visit rendering.
 *
 * Stores a slim snapshot of the first page of posts so that usePosts can show
 * content immediately while the real API fetch happens in the background.
 *
 * Design decisions:
 *  - Cache key includes chapterId (each chapter has its own feed)
 *  - Max 20 posts to limit storage (~40-60 KB typical)
 *  - comments_preview and link_previews stripped to reduce size
 *  - 5-minute TTL aligns with React Query staleTime
 *  - Cleared on logout to prevent data leaking between accounts
 */

import type { Post, PostsResponse } from '@/types/posts';

const CACHE_PREFIX = 'feed-cache';
const MAX_CACHED_POSTS = 20;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface FeedCacheEntry {
  posts: Post[];
  pagination: PostsResponse['pagination'];
  chapterId: string;
  timestamp: number;
}

function cacheKey(chapterId: string): string {
  return `${CACHE_PREFIX}-${chapterId}`;
}

/** Strip heavy nested fields and base64 image data for cache. */
function slimPost(post: Post): Post {
  const { comments_preview, ...rest } = post;
  let metadata = rest.metadata;
  if (metadata?.link_previews) {
    const { link_previews, ...metaRest } = metadata;
    metadata = metaRest;
  }
  const hasDataUrl = (url: string) => typeof url === 'string' && url.startsWith('data:');
  let image_url = rest.image_url ?? undefined;
  let has_image = false;
  if (hasDataUrl(image_url as string)) {
    image_url = null as unknown as undefined;
    has_image = true;
  } else if (image_url && (image_url as string).startsWith('http')) {
    has_image = true;
  }
  const urls = metadata?.image_urls;
  if (Array.isArray(urls) && urls.some((u: unknown) => hasDataUrl(u as string))) {
    has_image = true;
    metadata = { ...metadata, image_urls: [] };
  }
  return { ...rest, metadata, image_url: image_url ?? undefined, has_image, comments_preview: [] };
}

/**
 * Write the first page of feed data to localStorage.
 * Call this after a REAL fetch completes (not from placeholder data).
 */
export function writeFeedCache(chapterId: string, data: PostsResponse): void {
  try {
    const entry: FeedCacheEntry = {
      posts: data.posts.slice(0, MAX_CACHED_POSTS).map(slimPost),
      pagination: {
        ...data.pagination,
        // Clamp to reflect cached subset
        total: Math.min(data.pagination.total, MAX_CACHED_POSTS),
        totalPages: 1,
      },
      chapterId,
      timestamp: Date.now(),
    };
    localStorage.setItem(cacheKey(chapterId), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Read cached feed data. Returns null if no cache, expired, or invalid.
 */
export function readFeedCache(
  chapterId: string,
): (PostsResponse & { chapterId: string }) | null {
  try {
    const raw = localStorage.getItem(cacheKey(chapterId));
    if (!raw) return null;

    const entry: FeedCacheEntry = JSON.parse(raw);

    // Validate structure
    if (!entry.posts || !entry.pagination || !entry.timestamp || !entry.chapterId) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(cacheKey(chapterId));
      return null;
    }

    return {
      posts: entry.posts,
      pagination: entry.pagination,
      chapterId: entry.chapterId,
    };
  } catch {
    return null;
  }
}

/**
 * Remove all feed caches. Call on logout.
 */
export function clearFeedCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // silently ignore
  }
}