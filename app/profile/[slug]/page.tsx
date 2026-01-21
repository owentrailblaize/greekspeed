import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { fetchUserProfileBySlug } from '@/lib/services/userProfileService';
import { PublicProfileClient } from './PublicProfileClient';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const profile = await fetchUserProfileBySlug(slug);
  
  if (!profile) {
    return {
      title: 'Profile Not Found | Trailblaize',
    };
  }

  const title = `${profile.full_name} | Trailblaize Profile`;
  const description = profile.bio || `View ${profile.full_name}'s profile on Trailblaize. ${profile.chapter ? `Member of ${profile.chapter}.` : ''}`;
  const imageUrl = profile.avatar_url || `${process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net'}/logo.png`;
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://trailblaize.net'}/profile/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: imageUrl }],
      url,
      type: 'profile',
      siteName: 'Trailblaize',
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  
  const profile = await fetchUserProfileBySlug(slug);
  
  if (!profile) {
    notFound();
  }

  return <PublicProfileClient slug={slug} initialProfile={profile} />;
}

