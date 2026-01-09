'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Palette } from 'lucide-react';
import { toast } from 'react-toastify';
import { BrandingForm } from '@/components/features/branding/BrandingForm';
import type { ChapterBranding } from '@/types/branding';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';

/**
 * Branding Management Page
 * 
 * Allows developers and chapter admins to manage chapter branding
 */
export default function ChapterBrandingPage() {
  const router = useRouter();
  const params = useParams();
  const { profile, isDeveloper } = useProfile();
  const { session } = useAuth();
  const chapterId = params?.chapterId as string;

  const [branding, setBranding] = useState<ChapterBranding | null>(null);
  const [chapterInfo, setChapterInfo] = useState<{ name: string; university: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chapter info and branding
  useEffect(() => {
    if (!chapterId) {
      toast.error('Chapter ID is required');
      router.push('/dashboard/user-management');
      return;
    }

    fetchChapterInfoAndBranding();
  }, [chapterId, session?.access_token]);

  const fetchChapterInfoAndBranding = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors

      // Fetch chapter info - try the chapters API endpoint first
      try {
        const chapterResponse = await fetch(`/api/chapters/${chapterId}`);
        if (chapterResponse.ok) {
          const chapter = await chapterResponse.json();
          if (chapter) {
            setChapterInfo({
              name: chapter.name || chapter.chapter_name || 'Unknown Chapter',
              university: chapter.university || 'Unknown University',
            });
          }
        }
      } catch (chapterError) {
        console.warn('Could not fetch chapter details:', chapterError);
        // Continue even if chapter fetch fails - we can still manage branding
      }

      // Fetch branding (returns null if not exists yet)
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const brandingResponse = await fetch(`/api/branding/chapters/${chapterId}`, {
        headers,
      });
      if (brandingResponse.ok) {
        const brandingData = await brandingResponse.json();
        // API now returns null instead of 404 when no branding exists
        setBranding(brandingData || null);
      } else {
        const errorData = await brandingResponse.json().catch(() => ({ error: 'Failed to fetch branding' }));
        const errorMessage = errorData.error || 'Failed to fetch branding';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching chapter info and branding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load branding';
      setError(errorMessage); // Set error state instead of immediately redirecting
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: Partial<ChapterBranding>) => {
    try {
      setSubmitting(true);

      // Use PUT to create or update branding
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/branding/chapters/${chapterId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save branding');
      }

      const result = await response.json();
      
      // Update local state with the saved branding
      setBranding(result.branding);

      toast.success(result.message || 'Branding saved successfully!');
      
      // Optionally redirect after a short delay
      // setTimeout(() => {
      //   router.push('/dashboard/user-management');
      // }, 1500);
    } catch (error) {
      console.error('Error submitting branding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save branding';
      toast.error(errorMessage);
      throw error; // Re-throw so BrandingForm can handle it
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    router.push('/dashboard/user-management');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="text-gray-600">Loading branding...</p>
        </div>
      </div>
    );
  }

  // Show error state if there was an error loading
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">{error}</p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/dashboard/user-management')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to User Management
              </Button>
              <Button
                onClick={() => {
                  setError(null);
                  fetchChapterInfoAndBranding();
                }}
                variant="default"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Permission check - should already be handled by API, but we check here for better UX
  if (!isDeveloper && profile?.chapter_id !== chapterId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You don't have permission to manage branding for this chapter.
            </p>
            <Button onClick={() => router.push('/dashboard/user-management')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to User Management
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/user-management')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </Button>
              <div>
                <div className="flex items-center space-x-2">
                  <Palette className="h-6 w-6 text-brand-primary" />
                  <h1 className="text-3xl font-bold text-navy-900">Chapter Branding</h1>
                </div>
                {chapterInfo && (
                  <p className="text-gray-600 mt-1">
                    {chapterInfo.name} • {chapterInfo.university}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <BrandingForm
          initialData={branding}
          chapterId={chapterId}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}

