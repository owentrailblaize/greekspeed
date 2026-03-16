/**
 * Centralized app metadata for SEO and share previews (Open Graph, Twitter).
 * Use for root, auth, dashboard, and marketing layouts so titles and OG images stay consistent.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.trailblaize.net').replace(/\/$/, '');

export const APP_METADATA = {
  title: 'Trailblaize – Alumni Relationship Management',
  titleTemplate: (page?: string) =>
    page ? `${page} | Trailblaize` : 'Trailblaize – Alumni Relationship Management',
  description:
    'Trailblaize is the modern operating system for Greek organizations, powering alumni engagement, events, and chapter growth.',
  ogImagePath: '/og/Trailblaize.png',
  siteName: 'Trailblaize',
  baseUrl: BASE_URL,
} as const;

export function getAbsoluteOgImageUrl(): string {
  return `${APP_METADATA.baseUrl}${APP_METADATA.ogImagePath}`;
}
