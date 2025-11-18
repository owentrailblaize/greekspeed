'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { InviteManagement } from '@/components/features/invitations/InviteManagement';

export function InvitationsView() {
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Invitations</h2>
        <p className="text-sm text-gray-600 mt-1">Manage member invitations</p>
      </div>

      {chapterId && (
        <Card>
          <CardContent className="p-6">
            <InviteManagement 
              chapterId={chapterId} 
              className="w-full"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

