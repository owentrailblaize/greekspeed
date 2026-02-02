import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchEventBySlugOrId, fetchEventAttendees } from '@/lib/services/eventService';
import { PublicEventClient } from './PublicEventClient';

interface PageProps {
  params: Promise<{ slugOrId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slugOrId } = await params;
  
  const event = await fetchEventBySlugOrId(slugOrId);
  
  if (!event) {
    return {
      title: 'Event Not Found | Trailblaize',
    };
  }

  const title = `${event.title} | Trailblaize Event`;
  const description = event.description 
    || `Join us for ${event.title}${event.location ? ` at ${event.location}` : ''}`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net'}/event/${slugOrId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      siteName: 'Trailblaize',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function PublicEventPage({ params }: PageProps) {
  const { slugOrId } = await params;
  
  const event = await fetchEventBySlugOrId(slugOrId);
  
  if (!event) {
    notFound();
  }

  // Fetch attendee counts
  const attendees = await fetchEventAttendees(event.id);

  return (
    <PublicEventClient 
      event={event} 
      attendeeCounts={attendees || { attending: 0, maybe: 0, not_attending: 0 }} 
    />
  );
}

