import type { Metadata } from 'next';
import OnboardingLayoutClient from './OnboardingLayoutClient';
import { APP_METADATA } from '@/lib/constants/metadata';

export const metadata: Metadata = {
  title: 'Complete Your Profile – Trailblaize',
  description:
    'Finish setting up your Trailblaize profile – alumni relationship management for your chapter.',
  openGraph: {
    title: 'Complete Your Profile – Trailblaize',
    description: 'Finish setting up your Trailblaize profile.',
    url: `${APP_METADATA.baseUrl}/onboarding`,
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
    title: 'Complete Your Profile – Trailblaize',
    images: [APP_METADATA.ogImagePath],
  },
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <OnboardingLayoutClient>{children}</OnboardingLayoutClient>;
}
