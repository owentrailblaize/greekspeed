import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChapterMemberData } from '@/types/chapter';

export function useChapterMembers(chapterId?: string | null, excludeAlumni: boolean = false) {
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
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        let query = supabase
          .from('chapter_members_view')
          .select('*')
          .eq('chapter_id', chapterId);

        // Only exclude alumni if explicitly requested
        if (excludeAlumni) {
          query = query.neq('role', 'alumni');
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        setMembers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch members');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [chapterId, excludeAlumni]);

  return { members, loading, error };
} 