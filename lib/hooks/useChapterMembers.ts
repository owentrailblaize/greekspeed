import { useState, useEffect } from 'react';
import { ChapterMemberData } from '@/types/chapter';
import { useAuth } from '@/lib/supabase/auth-context';

export function useChapterMembers(chapterId?: string | null, excludeAlumni: boolean = false) {
  const { session } = useAuth();
  const [members, setMembers] = useState<ChapterMemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    const fetchMembers = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          chapter_id: chapterId,
          exclude_alumni: excludeAlumni.toString()
        });

        const headers: HeadersInit = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const response = await fetch(`/api/chapter/members?${params.toString()}`, {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }

        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [chapterId, excludeAlumni, session?.access_token]);

  return { members, loading, error };
} 