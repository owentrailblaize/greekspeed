import type { Metadata } from 'next';
import DashboardLayoutClient from './DashboardLayoutClient';
import { APP_METADATA } from '@/lib/constants/metadata';

export const metadata: Metadata = {
  title: 'Dashboard – Trailblaize',
  description:
    'Your Trailblaize dashboard – alumni relationship management, chapter feed, events, and more.',
  openGraph: {
    title: APP_METADATA.title,
    description: APP_METADATA.description,
    url: `${APP_METADATA.baseUrl}/dashboard`,
    siteName: APP_METADATA.siteName,
    images: [
      {
        url: APP_METADATA.ogImagePath,
        width: 1200,
        height: 630,
        alt: APP_METADATA.title,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_METADATA.title,
    images: [APP_METADATA.ogImagePath],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
