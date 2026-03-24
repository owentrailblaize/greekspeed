import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ event?: string; t?: string }>;
}

/**
 * Legacy route: redirect to /dashboard/check-in.
 * The check-in page moved under dashboard for consistent header/footer.
 */
export default async function CheckInRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const eventId = params.event?.trim();
  const t = params.t?.trim();
  const qs = new URLSearchParams();
  if (eventId) qs.set('event', eventId);
  if (t) qs.set('t', t);
  const query = qs.toString() ? `?${qs.toString()}` : '';
  redirect(`/dashboard/check-in${query}`);
}
