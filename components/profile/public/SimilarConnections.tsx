'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageWithFallback from '@/components/figma/ImageWithFallback';
import { Building2, Users } from 'lucide-react';

interface SimilarProfile {
  id: string;
  full_name: string;
  first_name?: string | null;
  last_name?: string | null;
  avatar_url?: string | null;
  chapter?: string | null;
  profile_slug?: string | null;
  username?: string | null;
}

interface SimilarConnectionsProps {
  slug: string;
  profileId: string;
  isLoggedIn: boolean;
  className?: string;
}

export function SimilarConnections({ slug, profileId, isLoggedIn, className }: SimilarConnectionsProps) {
  const [similarProfiles, setSimilarProfiles] = useState<SimilarProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilarConnections() {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/profile/similar/${slug}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch similar connections');
        }

        const data = await response.json();
        // Limit to 6 profiles max
        const profiles = (data.similar || []).slice(0, 6);
        setSimilarProfiles(profiles);
      } catch (err) {
        console.error('Error fetching similar connections:', err);
        setError(err instanceof Error ? err.message : 'Failed to load similar connections');
      } finally {
        setLoading(false);
      }
    }

    fetchSimilarConnections();
  }, [slug]);

  // Don't render if no similar profiles found
  if (!loading && similarProfiles.length === 0) {
    return null;
  }

  const getInitials = (profile: SimilarProfile) => {
    if (profile.first_name && profile.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  const getProfileSlug = (profile: SimilarProfile) => {
    return profile.profile_slug || profile.username || profile.id;
  };

  return (
    <div className={className}>
      {/* Section Title */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          People Also Viewed
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {isLoggedIn ? 'Members you might know' : 'Other members from the same chapter'}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="text-sm text-gray-500 py-4">
          Unable to load similar connections
        </div>
      )}

      {/* Similar Profiles List */}
      {!loading && !error && similarProfiles.length > 0 && (
        <div className="space-y-3">
          {similarProfiles.map((profile) => {
            const profileSlug = getProfileSlug(profile);
            return (
              <Link
                key={profile.id}
                href={`/profile/${profileSlug}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full border-2 border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                  {profile.avatar_url ? (
                    <ImageWithFallback
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getInitials(profile)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 group-hover:text-navy-600 transition-colors truncate">
                    {profile.full_name}
                  </p>
                  {profile.chapter && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-500 truncate">
                        {profile.chapter}
                      </p>
                    </div>
                  )}
                </div>

                {/* View Profile Indicator */}
                <div className="text-gray-400 group-hover:text-navy-600 transition-colors">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

