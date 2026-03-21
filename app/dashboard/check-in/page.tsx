import { CheckInPageClient } from './CheckInPageClient';

interface PageProps {
  searchParams: Promise<{ event?: string }>;
}

export default async function CheckInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const eventId = params.event?.trim();

  if (!eventId) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 pb-24 sm:pb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Check-in</h1>
        <p className="text-gray-500 text-center">
          Open this page from the QR code at the event, or use the link shared by your chapter.
        </p>
      </div>
    );
  }

  return <CheckInPageClient eventId={eventId} />;
}
