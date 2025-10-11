import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';

interface MutualConnection {
  id: string;
  name: string;
  avatar?: string | null;
}

interface UseMutualConnectionsResult {
  mutualConnections: MutualConnection[];
  count: number;
  loading: boolean;
  error: string | null;
}

export function useMutualConnections(targetUserId: string | undefined): UseMutualConnectionsResult {
  const { user } = useAuth();
  const [mutualConnections, setMutualConnections] = useState<MutualConnection[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't fetch if we don't have both user IDs or if it's the same user
    if (!user?.id || !targetUserId || user.id === targetUserId) {
      setMutualConnections([]);
      setCount(0);
      setLoading(false);
      return;
    }

    const fetchMutualConnections = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/connections/mutual?userId=${user.id}&targetUserId=${targetUserId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch mutual connections');
        }

        const data = await response.json();
        setMutualConnections(data.mutualConnections || []);
        setCount(data.count || 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch mutual connections');
        setMutualConnections([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMutualConnections();
  }, [user?.id, targetUserId]);

  return { mutualConnections, count, loading, error };
}

