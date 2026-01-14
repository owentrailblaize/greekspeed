import { supabase } from '@/lib/supabase/client';
import { UnifiedUserProfile, UserProfileType } from '@/types/user-profile';
import { Alumni } from '@/lib/alumniConstants';

// Cache for user profiles (in-memory, cleared on page refresh)
const profileCache = new Map<string, { data: UnifiedUserProfile; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get chapter name from chapter ID
 */
const getChapterName = (chapterId: string): string => {
  const chapterMap: Record<string, string> = {
    "404e65ab-1123-44a0-81c7-e8e75118e741": "Sigma Chi Eta (Ole Miss)",
    "8ede10e8-b848-427d-8f4a-aacf74cea2c2": "Phi Gamma Delta Omega Chi (Chapman)",
    "b25a4acf-59f0-46d4-bb5c-d41fda5b3252": "Phi Delta Theta Mississippi Alpha (Ole Miss)",
    "ff740e3f-c45c-4728-a5d5-22088c19d847": "Kappa Sigma Delta-Xi (Ole Miss)"
  };
  return chapterMap[chapterId] || chapterId;
};

/**
 * Fetch user profile by ID
 * Handles both alumni and regular users
 */
export async function fetchUserProfile(userId: string): Promise<UnifiedUserProfile | null> {
  // Check cache first
  const cached = profileCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // First, check if user is an alumni
    const { data: alumniData, error: alumniError } = await supabase
      .from('alumni')
      .select(`
        *,
        profile:profiles!user_id(
          avatar_url,
          banner_url,
          full_name,
          first_name,
          last_name,
          email,
          phone,
          chapter,
          chapter_id,
          bio,
          location
        )
      `)
      .eq('user_id', userId)
      .single();

    if (alumniData && !alumniError) {
      // User is an alumni
      const profile: UnifiedUserProfile = {
        id: userId,
        type: 'alumni',
        full_name: alumniData.full_name || `${alumniData.first_name || ''} ${alumniData.last_name || ''}`.trim(),
        first_name: alumniData.first_name,
        last_name: alumniData.last_name,
        avatar_url: alumniData.avatar_url || alumniData.profile?.avatar_url || null,
        email: alumniData.email,
        phone: alumniData.phone,
        chapter: alumniData.chapter ? getChapterName(alumniData.chapter) : null,
        chapter_id: alumniData.chapter,
        bio: alumniData.description || alumniData.profile?.bio || null,
        location: alumniData.location || alumniData.profile?.location || null,
        alumni: {
          industry: alumniData.industry,
          graduationYear: alumniData.graduation_year,
          company: alumniData.company,
          jobTitle: alumniData.job_title,
          is_email_public: alumniData.is_email_public,
          is_phone_public: alumniData.is_phone_public,
          isEmailPublic: alumniData.is_email_public,
          isPhonePublic: alumniData.is_phone_public,
          verified: alumniData.verified,
          isActivelyHiring: alumniData.is_actively_hiring,
          hasProfile: !!alumniData.profile,
          description: alumniData.description,
        }
      };

      // Cache the result
      profileCache.set(userId, { data: profile, timestamp: Date.now() });
      return profile;
    }

    // If not alumni, fetch regular profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    const profile: UnifiedUserProfile = {
      id: userId,
      type: 'user',
      full_name: profileData.full_name || 'Unknown User',
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      avatar_url: profileData.avatar_url,
      email: profileData.email,
      phone: profileData.phone,
      chapter: profileData.chapter,
      chapter_id: profileData.chapter_id,
      bio: profileData.bio,
      location: profileData.location,
      user: {
        role: profileData.role,
        chapter_role: profileData.chapter_role,
        member_status: profileData.member_status,
        grad_year: profileData.grad_year,
        major: profileData.major,
        minor: profileData.minor,
        linkedin_url: profileData.linkedin_url,
      }
    };

    // Cache the result
    profileCache.set(userId, { data: profile, timestamp: Date.now() });
    return profile;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
}

/**
 * Convert Alumni object to UnifiedUserProfile
 */
export function alumniToUnifiedProfile(alumni: Alumni): UnifiedUserProfile {
  return {
    id: alumni.id,
    type: 'alumni',
    full_name: alumni.fullName,
    first_name: alumni.firstName,
    last_name: alumni.lastName,
    avatar_url: alumni.avatar || null,
    email: alumni.email || null,
    phone: alumni.phone || null,
    chapter: alumni.chapter ? getChapterName(alumni.chapter) : null,
    chapter_id: alumni.chapter,
    bio: alumni.description,
    location: alumni.location,
    alumni: {
      industry: alumni.industry,
      graduationYear: alumni.graduationYear,
      company: alumni.company,
      jobTitle: alumni.jobTitle,
      is_email_public: alumni.is_email_public,
      is_phone_public: alumni.is_phone_public,
      isEmailPublic: alumni.isEmailPublic,
      isPhonePublic: alumni.isPhonePublic,
      verified: alumni.verified,
      isActivelyHiring: alumni.isActivelyHiring,
      lastContact: alumni.lastContact,
      hasProfile: alumni.hasProfile,
      description: alumni.description,
    }
  };
}

/**
 * Clear cache for a specific user or all users
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}

