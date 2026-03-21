import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ event?: string }>;
}

/**
 * Legacy route: redirect to /dashboard/check-in.
 * The check-in page moved under dashboard for consistent header/footer.
 */
export default async function CheckInRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const eventId = params.event?.trim();
  const query = eventId ? `?event=${encodeURIComponent(eventId)}` : '';
  redirect(`/dashboard/check-in${query}`);
}
