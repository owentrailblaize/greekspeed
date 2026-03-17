'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { LinkedInPdfHelpModal } from '@/components/features/onboarding/LinkedInPdfHelpModal';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  FileText,
  Upload,
  PenLine,
  HelpCircle,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';

type PrefillOption = 'linkedin' | 'resume' | 'manual';

export default function PrefillProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<PrefillOption | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  // const [showHelpModal, setShowHelpModal] = useState(false);

  // Redirect if not authenticated - wait for auth to finish loading first
  useEffect(() => {
    if (!authLoading && !user && !profileLoading) {
      router.push('/sign-in');
    }
  }, [user, authLoading, profileLoading, router]);

  // Get user's first name from profile or OAuth metadata
  const firstName = profile?.first_name ||
    user?.user_metadata?.given_name ||
    user?.user_metadata?.first_name ||
    user?.user_metadata?.name?.split(' ')[0] ||
    'there';

  // Get avatar URL
  const avatarUrl = profile?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar_url;

  // Get initials for avatar fallback
  const initials = firstName ? firstName.charAt(0).toUpperCase() : '?';

  const handleOptionSelect = async (option: PrefillOption) => {
    setSelectedOption(option);
    setIsNavigating(true);

    switch (option) {
      case 'linkedin':
        router.push('/onboarding/prefill-profile/upload?type=linkedin');
        break;
      case 'resume':
        router.push('/onboarding/prefill-profile/upload?type=resume');
        break;
      case 'manual':
        // Call skip API and redirect to dashboard or edit profile
        try {
          const { supabase } = await import('@/lib/supabase/client');
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;

          const response = await fetch('/api/profile-import/skip', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            router.push('/dashboard');
          } else {
            // Still redirect even if skip record fails
            router.push('/dashboard');
          }
        } catch (error) {
          console.error('Skip error:', error);
          router.push('/dashboard');
        }
        break;
    }
  };

  // Loading state - wait for both auth and profile to load
  if (authLoading || !user || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-accent-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-lg">
          {/* Header with Avatar */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={firstName} />
                ) : null}
                <AvatarFallback className="bg-brand-primary text-white text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              👋 Welcome, {firstName}!
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Let&apos;s set up your alumni profile
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Choose how you&apos;d like to prefill your information
            </p>
          </div>

          {/* Options */}
          <div className="space-y-4">
            {/* LinkedIn PDF Option - Recommended */}
            {/* DISABLED - LinkedIn import feature is temporarily hidden */}
            {/*
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-brand-primary/50 ${selectedOption === 'linkedin' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200'
                }`}
              onClick={() => !isNavigating && handleOptionSelect('linkedin')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">
                        Upload LinkedIn Profile PDF
                      </h3>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <Sparkles className="h-3 w-3" />
                        Recommended
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Fastest setup • Auto-fills your experience & education
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowHelpModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-sm text-brand-primary hover:text-brand-primary-hover mt-2 font-medium"
                    >
                      <HelpCircle className="h-4 w-4" />
                      How to download your LinkedIn PDF?
                    </button>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${selectedOption === 'linkedin' ? 'translate-x-1' : ''
                    }`} />
                </div>
              </CardContent>
            </Card>
            */}
            {/* Resume Option */}
            <Card
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-brand-primary/50 ${selectedOption === 'resume' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200'
                }`}
              onClick={() => !isNavigating && handleOptionSelect('resume')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      Upload Resume
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF or DOCX • We&apos;ll extract your experience
                    </p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${selectedOption === 'resume' ? 'translate-x-1' : ''
                    }`} />
                </div>
              </CardContent>
            </Card>

            {/* Manual Option */}
            <Card
              className={`rounded-full cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-brand-primary/50 ${selectedOption === 'manual' ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-gray-200'
                }`}
              onClick={() => !isNavigating && handleOptionSelect('manual')}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <PenLine className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-gray-900">
                      Fill in manually
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your information step by step
                    </p>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${selectedOption === 'manual' ? 'translate-x-1' : ''
                    }`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loading indicator when navigating */}
          {isNavigating && (
            <div className="flex items-center justify-center gap-2 mt-6 text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-8">
            You can always update your profile later in settings
          </p>
        </div>
      </div>

      {/* Help Modal - Placeholder for next ticket */}
      {/* DISABLED - LinkedIn import feature is temporarily hidden */}
      {/*
      {showHelpModal && (
        <LinkedInPdfHelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      )}
      */}
    </div>
  );
}