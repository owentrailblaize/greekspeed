import type { Metadata } from 'next';
import { validateInvitationToken } from '@/lib/utils/invitationUtils';
import JoinPageClient from './JoinPageClient';

// Dynamic metadata generation for invitation links
export async function generateMetadata(
  { params }: { params: Promise<{ token: string }> }
): Promise<Metadata> {
  const { token } = await params;
  
  try {
    const validation = await validateInvitationToken(token);
    
    if (validation.valid && validation.invitation) {
      const chapterName = validation.chapter_name || 'Trailblaize';
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net';
      
      return {
        title: `Join ${chapterName} on Trailblaize`,
        description: `You've been invited to join ${chapterName}. Create your account to get started with Trailblaize.`,
        openGraph: {
          title: `Join ${chapterName} on Trailblaize`,
          description: `You've been invited to join ${chapterName}. Create your account to get started with Trailblaize.`,
          url: `${baseUrl}/join/${token}`,
          siteName: 'Trailblaize',
          images: [
            {
              url: '/og/Trailblaize.png',
              width: 1200,
              height: 630,
              alt: `Join ${chapterName} on Trailblaize`,
            },
          ],
          type: 'website',
        },
        twitter: {
          card: 'summary_large_image',
          title: `Join ${chapterName} on Trailblaize`,
          description: `You've been invited to join ${chapterName}. Create your account to get started.`,
          images: ['/og/Trailblaize.png'],
        },
      };
    }
  } catch (error) {
    console.error('Error generating metadata:', error);
  }
  
  // Fallback metadata if invitation is invalid
  return {
    title: 'Join Trailblaize',
    description: 'Join your chapter on Trailblaize – Alumni Relationship Management',
    openGraph: {
      title: 'Join Trailblaize',
      description: 'Join your chapter on Trailblaize – Alumni Relationship Management',
      url: 'https://trailblaize.net',
      siteName: 'Trailblaize',
      images: [
        {
          url: '/og/Trailblaize.png',
          width: 1200,
          height: 630,
          alt: 'Join Trailblaize',
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Join Trailblaize',
      description: 'Join your chapter on Trailblaize – Alumni Relationship Management',
      images: ['/og/Trailblaize.png'],
    },
  };
}

// Server component that renders the client component
export default function JoinPage() {
  return <JoinPageClient />;
}
