'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UnifiedUserProfile } from '@/types/user-profile';
import { AlumniProfileView } from './AlumniProfileView';
import { UserProfileView } from './UserProfileView';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { Button } from '@/components/ui/button';
import { Loader2, X, AlertCircle } from 'lucide-react';

interface UserProfileModalProps {
  profile: UnifiedUserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  loading?: boolean;
  error?: string | null;
}

export function UserProfileModal({ profile, isOpen, onClose, loading = false, error = null }: UserProfileModalProps) {
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
  if (isMobile || !isOpen || !mounted) return null;

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
        {/* Loading State */}
        {loading && (
          <div className="p-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 text-brand-primary mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium">Loading profile...</p>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Error</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 font-medium mb-4">{error}</p>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}

        {/* Profile Content */}
        {!loading && !error && profile && (
          profile.type === 'alumni' ? (
            <AlumniProfileView profile={profile} onClose={onClose} />
          ) : (
            <UserProfileView profile={profile} onClose={onClose} />
          )
        )}
      </div>
    </div>,
    document.body
  );
}

