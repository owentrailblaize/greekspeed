'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

/**
 * Lightweight hook that tracks a post's comment count in real time
 * via Supabase Realtime, without fetching full comment data.
 */
export function useCommentCount(postId: string, initialCount: number): number {
  const [count, setCount] = useState(initialCount);
  const prevInitialRef = useRef(initialCount);

  useEffect(() => {
    if (prevInitialRef.current !== initialCount) {
      setCount(initialCount);
      prevInitialRef.current = initialCount;
    }
  }, [initialCount]);

  useEffect(() => {
    if (!postId) return;

    const channel = supabase
      .channel(`comment-count:${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          setCount((c) => c + 1);
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'post_comments',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          setCount((c) => Math.max(0, c - 1));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  return count;
}
