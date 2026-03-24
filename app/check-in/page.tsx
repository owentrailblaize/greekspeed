import { PublicCheckInPageClient } from './PublicCheckInPageClient';

interface PageProps {
  searchParams: Promise<{ event?: string; t?: string }>;
}

/**
 * Public check-in entry (camera QR, shared links). No dashboard chrome.
 * Minted URLs use this path; `/dashboard/check-in` remains for in-app "having trouble" fallback.
 */
export default async function PublicCheckInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const eventId = params.event?.trim();
  const urlCheckInToken = params.t?.trim() || undefined;

  if (!eventId) {
    return (
      <div className="w-full text-center py-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Event check-in</h1>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Open this page from the QR code at your event, or use the link your chapter shared.
        </p>
      </div>
    );
  }

  return (
    <PublicCheckInPageClient
      eventId={eventId}
      urlCheckInToken={urlCheckInToken}
    />
  );
}
