'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UnifiedUserProfile } from '@/types/user-profile';
import { AlumniProfileView } from './AlumniProfileView';
import { UserProfileView } from './UserProfileView';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

interface UserProfileModalProps {
  profile: UnifiedUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ profile, isOpen, onClose }: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen || isMobile) return; // Don't handle ESC on mobile

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isMobile]);

  // Don't render modal on mobile
  if (isMobile || !profile || !isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Card - Compact Design */}
      <div 
        className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto z-[10001]"
        onClick={(e) => e.stopPropagation()}
      >
        {profile.type === 'alumni' ? (
          <AlumniProfileView profile={profile} onClose={onClose} />
        ) : (
          <UserProfileView profile={profile} onClose={onClose} />
        )}
      </div>
    </div>,
    document.body
  );
}

