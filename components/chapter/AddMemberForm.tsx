'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/hooks/useProfile';
import { CreateUserForm } from '@/components/user-management/CreateUserForm';

interface AddMemberFormProps {
  onClose: () => void;
  onSuccess: () => void;
  chapterContext?: {
    chapterId: string;
    chapterName: string;
    isChapterAdmin?: boolean;
  };
}

export function AddMemberForm({ onClose, onSuccess, chapterContext }: AddMemberFormProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Get current user's chapter
  const currentChapter = profile?.chapter;

  if (!currentChapter) {
    return (
      <div className="text-center p-6">
        <p className="text-red-600">You must be associated with a chapter to add members.</p>
      </div>
    );
  }

  return (
    <CreateUserForm
      onClose={onClose}
      onSuccess={onSuccess}
      chapterContext={chapterContext}
    />
  );
}
