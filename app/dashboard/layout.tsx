'use client';

import { useState, useEffect } from 'react';
import SubscriptionPaywall from '@/components/shared/SubscriptionPaywall';
import { DashboardHeader } from '@/components/features/dashboard/DashboardHeader';
import { useActivityTracking } from '@/lib/hooks/useActivityTracking';
import { ModalProvider, useModal } from '@/lib/contexts/ModalContext';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { EditProfileModal } from '@/components/features/profile/EditProfileModal';
import { EditAlumniProfileModal } from '@/components/features/alumni/EditAlumniProfileModal';
import { ProfileService } from '@/lib/services/profileService';

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
            {children}
            
            {/* Global Edit Profile Modal - Rendered at layout level */}
            <EditProfileModalWrapper />
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

  if (!profile) return null;

  // Use alumni-specific modal for alumni users
  if (profile.role === 'alumni') {
    return (
      <EditAlumniProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={closeEditProfileModal}
        profile={profile}
        onUpdate={handleProfileUpdate}
        variant={isMobile ? 'mobile' : 'desktop'}
      />
    );
  }

  // Use regular modal for non-alumni users
  return (
    <EditProfileModal
      isOpen={isEditProfileModalOpen}
      onClose={closeEditProfileModal}
      profile={profile}
      onUpdate={handleProfileUpdate}
      variant={isMobile ? 'mobile' : 'desktop'}
    />
  );
} 