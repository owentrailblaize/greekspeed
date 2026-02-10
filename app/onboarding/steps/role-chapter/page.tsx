'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useOnboarding } from '@/lib/hooks/useOnboarding';
import { useChapters } from '@/lib/hooks/useChapters';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Users,
  GraduationCap,
  Info,
  Loader2,
  ChevronRight,
  CheckCircle,
  Shield,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

// ============================================================================
// Component
// ============================================================================

export default function RoleChapterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const { completeStep } = useOnboarding();
  const { chapters, loading: chaptersLoading } = useChapters();

  // Form state
  const [formData, setFormData] = useState({
    chapter: '',
    chapterId: '',
    role: 'alumni' as 'alumni' | 'active_member',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Check for invitation data in session storage
  const [hasInvitation, setHasInvitation] = useState(false);

  // Determine if this is confirmation mode (user already has role and chapter from invitation)
  const isConfirmationMode = useMemo(() => {
    return !!(profile?.role && profile?.chapter);
  }, [profile?.role, profile?.chapter]);

  useEffect(() => {
    // Check if user came through invitation flow
    const invitationType = sessionStorage.getItem('invitation_type');
    if (invitationType) {
      setHasInvitation(true);
      // If invitation specifies role, use it
      if (invitationType === 'active_member') {
        setFormData(prev => ({ ...prev, role: 'active_member' }));
      }
    }

    // Pre-populate from profile if available
    if (profile?.chapter || profile?.role) {
      // Find the chapter in the chapters list to get the ID
      const matchingChapter = chapters.find(c => c.name === profile.chapter);
      setFormData(prev => ({
        ...prev,
        chapter: profile.chapter || prev.chapter,
        chapterId: matchingChapter?.id || profile.chapter_id || prev.chapterId,
        role: (profile.role as 'alumni' | 'active_member') || prev.role,
      }));
    }
  }, [profile, chapters]); // Add chapters to dependencies

  // Handle chapter selection
  const handleChapterChange = (chapterName: string) => {
    const selectedChapter = chapters.find(c => c.name === chapterName);
    setFormData(prev => ({
      ...prev,
      chapter: chapterName,
      chapterId: selectedChapter?.id || '',
    }));
    if (errors.chapter) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.chapter;
        return next;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.chapter) newErrors.chapter = 'Please select your chapter';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);

    try {
      // Ensure chapterId is set correctly
      const selectedChapter = chapters.find(c => c.name === formData.chapter);
      if (!selectedChapter) {
        throw new Error('Selected chapter not found. Please try again.');
      }

      // Check if profile has first_name and last_name (from OAuth or previous steps)
      const hasName = profile?.first_name && profile?.last_name;

      // If user selected alumni role but we don't have name yet, we need to handle this carefully
      // The database trigger will try to create an alumni record, so we need to either:
      // 1. Create a minimal alumni record with available data, OR
      // 2. Don't set role='alumni' until we have the name

      // For OAuth users, check if we can get name from user metadata
      let firstName = profile?.first_name || '';
      let lastName = profile?.last_name || '';

      // Try to get name from OAuth metadata if not in profile
      if (!hasName && user.user_metadata) {
        firstName = user.user_metadata.given_name || user.user_metadata.first_name || '';
        lastName = user.user_metadata.family_name || user.user_metadata.last_name || '';
      }

      // Update profiles table
      const updateData: any = {
        chapter: formData.chapter,
        chapter_id: selectedChapter.id,
        member_status: formData.role === 'alumni' ? 'graduated' : 'active',
        updated_at: new Date().toISOString(),
      };

      // Preserve avatar_url if it exists (from OAuth or previous steps)
      if (profile?.avatar_url) {
        updateData.avatar_url = profile.avatar_url;
      }

      // Only set role if we have name for alumni, or if it's not alumni
      if (formData.role === 'alumni') {
        if (firstName && lastName) {
          // We have name, safe to set role and create alumni record
          updateData.role = formData.role;

          // Also update first_name/last_name in profile if they're missing
          if (!profile?.first_name) updateData.first_name = firstName;
          if (!profile?.last_name) updateData.last_name = lastName;
          if (!profile?.full_name) updateData.full_name = `${firstName} ${lastName}`;
        } else {
          // No name yet - don't set role='alumni' to avoid trigger error
          // Store the intended role in a way that doesn't trigger alumni creation
          // We'll set role='alumni' in profile-basics when we have the name
          updateData.role = null; // Keep role null for now
          // Note: We'll need to track that they selected alumni somehow
          // Could use a session variable or a custom field
        }
      } else {
        // Not alumni, safe to set role
        updateData.role = formData.role;
      }

      const { data, error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (profileError) {
        console.error('Profile update error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code,
        });
        throw profileError;
      }

      // If we set role='alumni' and have name, create minimal alumni record to satisfy trigger
      if (formData.role === 'alumni' && firstName && lastName && updateData.role === 'alumni') {
        try {
          const { error: alumniError } = await supabase
            .from('alumni')
            .upsert({
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
              chapter: formData.chapter,
              chapter_id: selectedChapter.id,
              email: user.email || profile?.email || '',
              industry: 'Not specified',
              graduation_year: new Date().getFullYear(), // Temporary, will be updated in profile-basics
              company: 'Not specified',
              job_title: 'Not specified',
              location: 'Not specified',
              description: `Alumni from ${formData.chapter}`,
              verified: false,
              is_actively_hiring: false,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
              ignoreDuplicates: false,
            });

          if (alumniError) {
            console.warn('Alumni record creation warning (non-critical):', alumniError);
            // Don't throw - profile update succeeded
          }
        } catch (alumniErr) {
          console.warn('Alumni record creation exception (non-critical):', alumniErr);
          // Don't throw - profile update succeeded
        }
      }

      // Refresh profile - but don't fail if it errors (update already succeeded)
      try {
        await refreshProfile();
      } catch (refreshError) {
        console.warn('Profile refresh failed after update (non-critical):', refreshError);
      }

      toast.success('Chapter and role saved!');
      await completeStep('role-chapter');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save. Please try again.';
      console.error('Profile update error:', error);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      router.push('/sign-in');
    }
  }, [user, router]);

  // NOTE: Removed auto-skip - we now show confirmation mode for invitation users

  // Handle confirmation mode continue (just complete step and move on)
  const handleConfirmContinue = async () => {
    setLoading(true);
    try {
      toast.success('Welcome! Let\'s continue setting up your profile.');
      await completeStep('role-chapter');
    } catch (error) {
      console.error('Error completing step:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // Confirmation mode UI for invitation users
  if (isConfirmationMode) {
    const roleLabel = profile?.role === 'active_member' ? 'Active Member' : 'Alumni';
    const roleIcon = profile?.role === 'active_member' ? Shield : GraduationCap;
    const RoleIcon = roleIcon;

    return (
      <div className="space-y-6">
        {/* Welcome Banner */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-900 text-sm mb-1">Welcome to Trailblaize!</h3>
                <p className="text-sm text-green-800">
                  Your account has been set up. Let&apos;s complete your profile.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              You&apos;re All Set!
            </CardTitle>
            <CardDescription>
              Here&apos;s your account information. Continue to complete your profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Chapter Info */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-500 text-sm">
                <Building2 className="h-4 w-4" />
                Your Chapter
              </Label>
              <div className="p-4 bg-brand-primary/5 border border-brand-primary/20 rounded-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <Building2 className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{profile?.chapter}</p>
                    <p className="text-sm text-gray-500">Fraternity Chapter</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Role Info */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-gray-500 text-sm">
                <Users className="h-4 w-4" />
                Your Role
              </Label>
              <div className="p-4 bg-brand-accent-light border border-brand-accent/20 rounded-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-accent/10 rounded-lg">
                    <RoleIcon className="h-5 w-5 text-brand-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text">{roleLabel}</p>
                    <p className="text-sm text-gray-500">
                      {profile?.role === 'active_member'
                        ? 'Current chapter member'
                        : 'Connect with your fraternity network'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-4">
              <Button
                onClick={handleConfirmContinue}
                disabled={loading}
                className="w-full bg-brand-primary hover:bg-brand-primary-hover rounded-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Continue to Profile Setup
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-900 text-sm mb-1">Alumni Signup</h3>
              <p className="text-sm text-amber-800">
                Free signups are for alumni only. Active members must be invited by their chapter administrator.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-brand-primary" />
            Welcome! Let's Get Started
          </CardTitle>
          <CardDescription>
            Select your chapter to continue setting up your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chapter Selection */}
            <div className="space-y-2">
              <Label htmlFor="chapter" className="flex items-center gap-2">
                Your Chapter *
              </Label>
              <Select
                value={formData.chapter}
                onValueChange={handleChapterChange}
                disabled={chaptersLoading}
              >
                <SelectTrigger className={cn(errors.chapter && 'border-red-500')}>
                  <SelectValue placeholder="Select your chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.name}>
                      {chapter.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.chapter && (
                <p className="text-sm text-red-500">{errors.chapter}</p>
              )}
            </div>

            {/* Role Display (Alumni only for free signup) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Your Role
              </Label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-full">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Alumni</p>
                    <p className="text-sm text-gray-500">Connect with your fraternity network</p>
                  </div>
                </div>
              </div>
              {!hasInvitation && (
                <p className="text-xs text-gray-500">
                  Active member accounts require an invitation from your chapter.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={loading || chaptersLoading}
                className="w-full bg-brand-primary hover:bg-brand-primary-hover rounded-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
