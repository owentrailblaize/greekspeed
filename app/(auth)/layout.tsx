import type { Metadata } from 'next';
import { ReactNode } from 'react';
import { APP_METADATA } from '@/lib/constants/metadata';

export const metadata: Metadata = {
  title: 'Sign in – Trailblaize',
  description:
    'Sign in to Trailblaize – Alumni Relationship Management. Manage your chapter, connect with alumni, and grow your network.',
  openGraph: {
    title: 'Sign in – Trailblaize',
    description: 'Sign in to Trailblaize – Alumni Relationship Management.',
    url: `${APP_METADATA.baseUrl}/sign-in`,
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
    title: 'Sign in – Trailblaize',
    description: 'Sign in to Trailblaize – Alumni Relationship Management.',
    images: [APP_METADATA.ogImagePath],
  },
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
