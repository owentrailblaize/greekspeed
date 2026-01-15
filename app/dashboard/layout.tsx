'use client';

import { useState, useEffect } from 'react';
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { useActivityTracking } from '@/lib/hooks/useActivityTracking';
import { ModalProvider, useModal } from '@/lib/contexts/ModalContext';
import { ProfileModalProvider, useProfileModal } from '@/lib/contexts/ProfileModalContext';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { EditProfileModal } from '@/components/features/profile/EditProfileModal';
import { EditAlumniProfileModal } from '@/components/features/alumni/EditAlumniProfileModal';
import { UserProfileModal } from '@/components/features/user-profile/UserProfileModal';
import { ProfileService } from '@/lib/services/profileService';
import { ProfileUpdatePromptModal } from '@/components/features/profile/ProfileUpdatePromptModal';
import type { DetectedChange } from '@/components/features/profile/ProfileUpdatePromptModal';
import { useAuth } from '@/lib/supabase/auth-context';
import type { CreatePostRequest } from '@/types/posts';
import { isPromptInCooldown, recordPromptShown } from '@/lib/utils/profileUpdateCooldown';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize activity tracking for all dashboard pages
  useActivityTracking()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Always show the header */}
      <DashboardHeader />
      
      {/* Wrap the main content with SubscriptionPaywall */}
      <SubscriptionPaywall>
        <main className="flex-1">
          <ModalProvider>
            <ProfileModalProvider>
              {children}
              
              {/* Global Edit Profile Modal - Rendered at layout level */}
              <EditProfileModalWrapper />
              
              {/* Global User Profile Modal - Rendered at layout level */}
              <UserProfileModalWrapper />
            </ProfileModalProvider>
          </ModalProvider>
        </main>
      </SubscriptionPaywall>
    </div>
  );
}

// Global Modal Wrapper Component
function EditProfileModalWrapper() {
  const { isEditProfileModalOpen, closeEditProfileModal } = useModal();
  const { profile, refreshProfile } = useProfile();
  const [isMobile, setIsMobile] = useState(false);
  
  // State for profile update prompt modal
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [detectedChanges, setDetectedChanges] = useState<DetectedChange[]>([]);
  const { getAuthHeaders, session } = useAuth();

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleProfileUpdate = async (updatedProfile: any) => {
    try {
      // Update profile data without page reload
      const result = await ProfileService.updateProfile(updatedProfile);
      
      if (result) {
        // Refresh profile data
        await refreshProfile();
        // Close the modal
        closeEditProfileModal();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Handler for when profile is updated with detected changes
  const handleProfileUpdatedWithChanges = (changes: DetectedChange[]) => {
    if (!profile?.id) return;
    
    // Check if prompt is in cooldown period
    if (isPromptInCooldown(profile.id)) {
      // Skip showing prompt - within cooldown period
      return;
    }
    
    // Record that we're showing this prompt (starts cooldown)
    recordPromptShown(profile.id);
    
    // Show the prompt
    setDetectedChanges(changes);
    setShowUpdatePrompt(true);
  };

  // Handle post creation from prompt modal
  const handleCreatePost = async (content: string) => {
    if (!profile?.chapter_id || !session) {
      throw new Error('Missing required information to create post');
    }

    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    };

    const metadata: CreatePostRequest['metadata'] = detectedChanges.length > 0 ? {
      profile_update: {
        source: 'profile_update_prompt',
        changed_fields: detectedChanges.map(c => c.field),
        change_types: detectedChanges.map(c => c.type),
      },
    } : undefined;

    const postData: CreatePostRequest = {
      content,
      post_type: 'text',
      ...(metadata && { metadata }),
    };

    const response = await fetch('/api/posts', {
      method: 'POST',
      headers,
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error?.error ?? 'Failed to create post');
    }

    // Post created successfully - close prompt modal
    setShowUpdatePrompt(false);
    setDetectedChanges([]);
  };

  // Handle skip from prompt modal
  const handleSkipPost = () => {
    setShowUpdatePrompt(false);
    setDetectedChanges([]);
  };

  if (!profile) return null;

  // Use alumni-specific modal for alumni users
  if (profile.role === 'alumni') {
    return (
      <>
        <EditAlumniProfileModal
          isOpen={isEditProfileModalOpen}
          onClose={closeEditProfileModal}
          profile={profile}
          onUpdate={handleProfileUpdate}
          variant={isMobile ? 'mobile' : 'desktop'}
          onProfileUpdatedWithChanges={handleProfileUpdatedWithChanges}
        />
        
        {/* Profile Update Prompt Modal */}
        {showUpdatePrompt && detectedChanges.length > 0 && (
          <ProfileUpdatePromptModal
            isOpen={showUpdatePrompt}
            onClose={handleSkipPost}
            onPost={handleCreatePost}
            onSkip={handleSkipPost}
            detectedChanges={detectedChanges}
            userProfile={{
              full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
              avatar_url: profile.avatar_url,
              chapter: profile.chapter,
            }}
          />
        )}
      </>
    );
  }

  // Use regular modal for non-alumni users
  return (
    <>
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={closeEditProfileModal}
        profile={profile}
        onUpdate={handleProfileUpdate}
        variant={isMobile ? 'mobile' : 'desktop'}
        onProfileUpdatedWithChanges={handleProfileUpdatedWithChanges}
      />
      
      {/* Profile Update Prompt Modal */}
      {showUpdatePrompt && detectedChanges.length > 0 && (
        <ProfileUpdatePromptModal
          isOpen={showUpdatePrompt}
          onClose={handleSkipPost}
          onPost={handleCreatePost}
          onSkip={handleSkipPost}
          detectedChanges={detectedChanges}
          userProfile={{
            full_name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            avatar_url: profile.avatar_url,
            chapter: profile.chapter,
          }}
        />
      )}
    </>
  );
}

// Global User Profile Modal Wrapper Component
function UserProfileModalWrapper() {
  const { isProfileModalOpen, currentProfile, closeUserProfile } = useProfileModal();

  return (
    <UserProfileModal
      profile={currentProfile}
      isOpen={isProfileModalOpen}
      onClose={closeUserProfile}
    />
  );
} 