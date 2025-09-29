'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EditAlumniProfileModal } from '@/components/EditAlumniProfileModal';
import { useProfile } from '@/lib/hooks/useProfile';
import { supabase } from '@/lib/supabase/client';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  GraduationCap,
  Calendar,
  Edit3,
  Loader2,
  Linkedin
} from 'lucide-react';
import ImageWithFallback from "../../figma/ImageWithFallback";

interface AlumniData {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  chapter: string;
  industry: string;
  graduation_year: number;
  company: string;
  job_title: string;
  email: string;
  phone: string | null;
  location: string;
  description: string;
  avatar_url: string | null;
  banner_url: string | null;
  verified: boolean;
  is_actively_hiring: boolean;
  created_at: string;
  updated_at: string;
  linkedin_url: string | null;
}

interface PersonalAlumniProfileProps {
  variant?: 'desktop' | 'mobile';
}

export function PersonalAlumniProfile({ variant = 'desktop' }: PersonalAlumniProfileProps) {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const [alumniData, setAlumniData] = useState<AlumniData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cache key for sessionStorage
  const getCacheKey = useCallback(() => {
    return profile?.id ? `alumni-profile-${profile.id}` : null;
  }, [profile?.id]);

  // Load from cache
  const loadFromCache = useCallback((): AlumniData | null => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return null;
    
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cache is not too old (5 minutes)
        const maxAge = 5 * 60 * 1000;
        if (Date.now() - parsed.timestamp < maxAge) {
          return parsed.data;
        }
      }
    } catch (error) {
      console.error('Error loading alumni data from cache:', error);
    }
    return null;
  }, [getCacheKey]);

  // Save to cache
  const saveToCache = useCallback((data: AlumniData) => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;
    
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving alumni data to cache:', error);
    }
  }, [getCacheKey]);

  // Clear cache
  const clearCache = useCallback(() => {
    const cacheKey = getCacheKey();
    if (!cacheKey) return;
    
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing alumni data cache:', error);
    }
  }, [getCacheKey]);

  const loadAlumniData = useCallback(async (forceRefresh = false) => {
    if (!profile?.id || profile.role !== 'alumni') {
      setLoading(false);
      return;
    }

    // Check cache first unless force refresh
    if (!forceRefresh) {
      const cachedData = loadFromCache();
      if (cachedData) {
        setAlumniData(cachedData);
        setLoading(false);
        setIsInitialized(true);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const { data: alumni, error: alumniError } = await supabase
        .from('alumni')
        .select(`
          *,
          profile:profiles!user_id(
            avatar_url,
            banner_url
          )
        `)
        .eq('user_id', profile.id)
        .single();

      if (alumniError) {
        console.error('Error fetching alumni data:', alumniError);
        setError('Failed to load alumni profile');
        return;
      }

      // Merge the profile avatar_url and banner_url into the alumni data
      const alumniWithProfile = {
        ...alumni,
        avatar_url: alumni.avatar_url || alumni.profile?.avatar_url,
        banner_url: alumni.banner_url || alumni.profile?.banner_url
      };

      setAlumniData(alumniWithProfile);
      saveToCache(alumniWithProfile);
    } catch (err) {
      console.error('Error loading alumni data:', err);
      setError('Failed to load alumni profile');
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, [profile?.id, profile?.role, loadFromCache, saveToCache]);

  // Initialize data on mount
  useEffect(() => {
    if (profile && !isInitialized) {
      loadAlumniData();
    }
  }, [profile, isInitialized, loadAlumniData]);

  const handleEditProfile = () => {
    setEditModalOpen(true);
  };

  const handleProfileUpdate = async (updatedProfile: any) => {
    try {
      // Update the profile using ProfileContext
      await updateProfile(updatedProfile);
      
      // Clear cache and refresh alumni data after profile update
      clearCache();
      await loadAlumniData(true);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show loading until both profile and alumni data are ready
  if (profileLoading || loading || !isInitialized) {
    return (
      <div className="sticky top-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-navy-600" />
              <span className="ml-2 text-gray-600">Loading profile...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sticky top-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => loadAlumniData(true)}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || profile.role !== 'alumni' || !alumniData) {
    return (
      <div className="sticky top-6">
        <Card className="bg-white">
          <CardContent className="p-6">
            <div className="text-center text-gray-600">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No alumni profile found</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mobile Layout
  if (variant === 'mobile') {
    return (
      <>
        <div className="h-screen w-screen bg-white -m-4">
          {/* Header with backdrop and avatar */}
          <div className="relative h-32 bg-gradient-to-r from-blue-600 to-purple-600">
            {alumniData.banner_url ? (
              <img 
                src={alumniData.banner_url} 
                alt={`${alumniData.full_name} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" />
            )}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {alumniData.avatar_url ? (
                  <ImageWithFallback 
                    src={alumniData.avatar_url} 
                    alt={alumniData.full_name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-navy-600 font-bold text-xl">
                    {getInitials(alumniData.full_name)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="px-4 pt-12 pb-20">
            {/* Profile Information */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {alumniData.full_name}
              </h3>
              
              <div className="flex items-center justify-center mb-3">
                <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                  {alumniData.graduation_year}
                </Badge>
              </div>

              <p className="text-base text-blue-600 font-medium mb-4">
                {alumniData.chapter}
              </p>

              {alumniData.is_actively_hiring && (
                <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1 mb-4">
                  Actively Hiring
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-4 mb-6">
              {alumniData.job_title && alumniData.company && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{alumniData.job_title} at {alumniData.company}</span>
                </div>
              )}

              {alumniData.industry && alumniData.industry !== 'Not specified' && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{alumniData.industry}</span>
                </div>
              )}

              {profile.location && profile.location !== 'Not specified' && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{profile.location}</span>
                </div>
              )}

              {alumniData.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-5 w-5 mr-3 text-gray-400" />
                  <span>{alumniData.phone}</span>
                </div>
              )}

              {alumniData.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-5 w-5 mr-3 text-gray-400" />
                  <span className="truncate">{alumniData.email}</span>
                </div>
              )}

              {alumniData.linkedin_url && (
                <div className="flex items-center text-sm text-gray-600">
                  <Linkedin className="h-5 w-5 mr-3 text-gray-400" />
                  <a 
                    href={alumniData.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {/* Bio */}
            {alumniData.description && alumniData.description !== `Alumni from ${alumniData.chapter}` && (
              <div className="mb-6">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {alumniData.description}
                </p>
              </div>
            )}

            {/* Profile Stats */}
            <div className="border-t border-gray-100 pt-4 mb-6">
              <div className="flex items-center justify-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Joined {formatDate(alumniData.created_at)}</span>
              </div>
            </div>

            {/* Edit Button */}
            <Button 
              onClick={handleEditProfile}
              variant="outline" 
              className="w-full text-navy-600 border-navy-600 hover:bg-navy-50 h-12 text-base"
            >
              <Edit3 className="h-5 w-5 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {editModalOpen && (
          <EditAlumniProfileModal
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            profile={profile}
            onUpdate={handleProfileUpdate}
            variant="mobile"
          />
        )}
      </>
    );
  }

  // Desktop Layout (Original)
  return (
    <>
      <div className="sticky top-6">
        <Card className="bg-white overflow-hidden">
          {/* Header with backdrop and avatar */}
          <div className="relative h-24 bg-gradient-to-r from-blue-600 to-purple-600">
            {alumniData.banner_url ? (
              <img 
                src={alumniData.banner_url} 
                alt={`${alumniData.full_name} banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-600" />
            )}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
              <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                {alumniData.avatar_url ? (
                  <ImageWithFallback 
                    src={alumniData.avatar_url} 
                    alt={alumniData.full_name}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-navy-600 font-bold text-lg">
                    {getInitials(alumniData.full_name)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <CardContent className="pt-8 pb-4">
            {/* Profile Information */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {alumniData.full_name}
              </h3>
              
              <div className="flex items-center justify-center mb-2">
                <Badge className="bg-blue-100 text-blue-800 text-xs">
                  {alumniData.graduation_year}
                </Badge>
              </div>

              <p className="text-sm text-blue-600 font-medium mb-3">
                {alumniData.chapter}
              </p>

              {alumniData.is_actively_hiring && (
                <Badge className="bg-green-100 text-green-800 text-xs mb-3">
                  Actively Hiring
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3 mb-4">
              {alumniData.job_title && alumniData.company && (
                <div className="flex items-center text-sm text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{alumniData.job_title} at {alumniData.company}</span>
                </div>
              )}

              {alumniData.industry && alumniData.industry !== 'Not specified' && (
                <div className="flex items-center text-sm text-gray-600">
                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{alumniData.industry}</span>
                </div>
              )}

              {profile.location && profile.location !== 'Not specified' && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{profile.location}</span>
                </div>
              )}

              {alumniData.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{alumniData.phone}</span>
                </div>
              )}

              {alumniData.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">{alumniData.email}</span>
                </div>
              )}

              {alumniData.linkedin_url && (
                <div className="flex items-center text-sm text-gray-600">
                  <Linkedin className="h-4 w-4 mr-2 text-gray-400" />
                  <a 
                    href={alumniData.linkedin_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 truncate"
                  >
                    LinkedIn Profile
                  </a>
                </div>
              )}
            </div>

            {/* Bio */}
            {alumniData.description && alumniData.description !== `Alumni from ${alumniData.chapter}` && (
              <div className="mb-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {alumniData.description}
                </p>
              </div>
            )}

            {/* Profile Stats */}
            <div className="border-t border-gray-100 pt-3 mb-4">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Calendar className="h-3 w-3 mr-1" />
                <span>Joined {formatDate(alumniData.created_at)}</span>
              </div>
            </div>

            {/* Edit Button */}
            <Button 
              onClick={handleEditProfile}
              variant="outline" 
              className="w-full text-navy-600 border-navy-600 hover:bg-navy-50"
              size="sm"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      {editModalOpen && (
        <EditAlumniProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          profile={profile}
          onUpdate={handleProfileUpdate}
        />
      )}
    </>
  );
}
