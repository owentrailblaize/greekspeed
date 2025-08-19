import { useState, useEffect } from 'react';
import { Chapter } from '@/types/chapter';

export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChapters = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/chapters');
        
        if (!response.ok) {
          throw new Error('Failed to fetch chapters');
        }
        
        const data = await response.json();
        setChapters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chapters');
        // Fallback to empty array so the form doesn't break
        setChapters([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChapters();
  }, []);

  return { chapters, loading, error };
}
