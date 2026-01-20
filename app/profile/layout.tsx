'use client';

import { ProfileModalProvider } from '@/lib/contexts/ProfileModalContext';
import { UserProfileModal } from '@/components/features/user-profile/UserProfileModal';
import { useProfileModal } from '@/lib/contexts/ProfileModalContext';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileModalProvider>
      {children}
      <UserProfileModalWrapper />
    </ProfileModalProvider>
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

