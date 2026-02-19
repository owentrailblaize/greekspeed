'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { InviteManagement } from '@/components/features/invitations/InviteManagement';
import { useScopedChapterId } from '@/lib/hooks/useScopedChapterId';

export function InvitationsView() {
  const { profile } = useProfile();
  const chapterId = useScopedChapterId();

  return (
    <div className="space-y-6">
      {chapterId && (
        <InviteManagement 
          chapterId={chapterId} 
          className="w-full"
        />
      )}
    </div>
  );
}

