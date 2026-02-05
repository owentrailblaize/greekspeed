import { useState, useEffect, useCallback } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { canManageChapter } from '@/lib/permissions';
import { toast } from 'react-toastify';

export function useChapterBudget() {
  const { profile } = useProfile();
  const { session } = useAuth();
  const chapterId = profile?.chapter_id;
  const [startingBudget, setStartingBudget] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Check if user can edit budget
  const canEdit = profile ? canManageChapter(profile.role as any, profile.chapter_role) : false;

  const fetchBudget = useCallback(async () => {
    if (!chapterId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/chapter/budget?chapter_id=${chapterId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch budget');
      }
      
      const data = await response.json();
      setStartingBudget(data.starting_budget);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Fallback to default if fetch fails
      setStartingBudget(12000);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  const updateBudget = useCallback(async (newBudget: number): Promise<boolean> => {
    if (!chapterId || !session?.access_token) {
      toast.error('Not authenticated');
      return false;
    }

    if (!canEdit) {
      toast.error('You do not have permission to edit the budget');
      return false;
    }

    // Validate budget value
    if (isNaN(newBudget) || newBudget < 0) {
      toast.error('Budget must be a positive number');
      return false;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/chapter/budget', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          chapter_id: chapterId,
          starting_budget: newBudget
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update budget');
      }

      const data = await response.json();
      setStartingBudget(data.starting_budget);
      toast.success('Budget updated successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update budget';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  }, [chapterId, session?.access_token, canEdit]);

  useEffect(() => {
    fetchBudget();
  }, [fetchBudget]);

  return {
    startingBudget: startingBudget ?? 12000, // Default fallback
    loading,
    error,
    saving,
    canEdit,
    refetch: fetchBudget,
    updateBudget
  };
}

