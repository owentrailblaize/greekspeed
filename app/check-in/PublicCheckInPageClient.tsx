'use client';

import { CheckInClient } from '@/app/dashboard/check-in/CheckInClient';

interface PublicCheckInPageClientProps {
  eventId: string;
  urlCheckInToken?: string;
}

export function PublicCheckInPageClient({
  eventId,
  urlCheckInToken,
}: PublicCheckInPageClientProps) {
  return (
    <div className="w-full flex flex-col items-center">
      <CheckInClient
        eventId={eventId}
        urlCheckInToken={urlCheckInToken}
        returnPathBase="public"
      />
    </div>
  );
}
