'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { Button } from '@/components/ui/button';
import {
  ProfilePdfUploader,
  ImportReviewForm,
  LinkedInPdfHelpModal,
} from '@/components/features/onboarding';
import {
  ProfileImport,
  ParsedLinkedInData,
  ImportConfidence,
  ImportReviewFormData,
  ImportSource,
} from '@/types/profile-import';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  FileText,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type UploadStep = 'upload' | 'parsing' | 'review' | 'applying';

interface ParseApiResponse {
  success: boolean;
  importId?: string;
  data?: ParsedLinkedInData;
  confidence?: ImportConfidence;
  error?: string;
  details?: string;
}

interface ApplyApiResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, session, loading: authLoading } = useAuth();

  // Determine source type from query param
  const sourceType = (searchParams.get('type') as 'linkedin' | 'resume') || 'linkedin';
  const importSource: ImportSource = sourceType === 'resume' ? 'resume_pdf' : 'linkedin_pdf';

  // Step tracking
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');

  // Data state
  const [importRecord, setImportRecord] = useState<ProfileImport | null>(null);
  const [parsedData, setParsedData] = useState<ParsedLinkedInData | null>(null);
  const [confidence, setConfidence] = useState<ImportConfidence | null>(null);

  // UI state
  const [error, setError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Redirect if not authenticated - wait for auth to finish loading first
  useEffect(() => {
    if (!authLoading && !user && !session) {
      router.push('/sign-in');
    }
  }, [user, session, authLoading, router]);

  /**
   * Handle successful upload - proceed to parse
   */
  const handleUploadComplete = useCallback(async (record: ProfileImport, signedUrl: string) => {
    setImportRecord(record);
    setError(null);
    setCurrentStep('parsing');

    try {
      // Call parse API
      const response = await fetch('/api/profile-import/parse', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ importId: record.id }),
      });

      const result: ParseApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.details || 'Failed to parse PDF');
      }

      // Success - move to review step
      setParsedData(result.data || null);
      setConfidence(result.confidence || null);
      setCurrentStep('review');
      toast.success('PDF parsed successfully! Please review your information.');

    } catch (err) {
      console.error('Parse error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to parse PDF';
      setError(errorMessage);
      setCurrentStep('upload');
      toast.error(errorMessage);
    }
  }, [session]);

  /**
   * Handle upload error
   */
  const handleUploadError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setCurrentStep('upload');
  }, []);

  /**
   * Handle review form confirmation
   */
  const handleConfirm = useCallback(async (formData: ImportReviewFormData) => {
    if (!importRecord?.id) {
      toast.error('No import record found');
      return;
    }

    setCurrentStep('applying');
    setError(null);

    try {
      const response = await fetch('/api/profile-import/apply', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          importId: importRecord.id,
          formData,
        }),
      });

      const result: ApplyApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to apply changes');
      }

      // Success!
      toast.success('Profile updated successfully!');
      
      // Redirect to dashboard
      router.push('/dashboard');

    } catch (err) {
      console.error('Apply error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setError(errorMessage);
      setCurrentStep('review');
      toast.error(errorMessage);
    }
  }, [importRecord, session, router]);

  /**
   * Handle back button
   */
  const handleBack = useCallback(() => {
    if (currentStep === 'review') {
      // Go back to upload, keeping the import record for retry
      setCurrentStep('upload');
      setParsedData(null);
      setConfidence(null);
    } else {
      // Go back to choice page
      router.push('/onboarding/prefill-profile');
    }
  }, [currentStep, router]);

  // Loading state while checking auth - wait for auth to finish loading
  if (authLoading || !user || !session) {
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

      <div className="relative z-10 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              disabled={currentStep === 'parsing' || currentStep === 'applying'}
              className="mb-4 -ml-2 text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-6">
              <StepDot active={currentStep === 'upload'} completed={currentStep !== 'upload'} />
              <StepLine completed={currentStep !== 'upload'} />
              <StepDot 
                active={currentStep === 'parsing' || currentStep === 'review'} 
                completed={currentStep === 'applying'} 
              />
              <StepLine completed={currentStep === 'applying'} />
              <StepDot active={currentStep === 'applying'} completed={false} />
            </div>

            {/* Title */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mb-4">
                {sourceType === 'linkedin' ? (
                  <FileText className="h-7 w-7 text-blue-600" />
                ) : (
                  <FileText className="h-7 w-7 text-purple-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {getStepTitle(currentStep, sourceType)}
              </h1>
              <p className="text-gray-500">
                {getStepDescription(currentStep, sourceType)}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && currentStep === 'upload' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Upload Step */}
            {currentStep === 'upload' && (
              <div className="space-y-6">
                <ProfilePdfUploader
                  source={importSource}
                  onUploadComplete={handleUploadComplete}
                  onError={handleUploadError}
                  helpText={
                    sourceType === 'linkedin'
                      ? 'Upload the PDF you downloaded from LinkedIn'
                      : 'Upload your resume in PDF format'
                  }
                />

                {/* LinkedIn Help Link */}
                {sourceType === 'linkedin' && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="inline-flex items-center gap-2 text-sm text-brand-primary hover:text-brand-primary-hover font-medium"
                    >
                      <HelpCircle className="h-4 w-4" />
                      How to download your LinkedIn PDF?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Parsing Step */}
            {currentStep === 'parsing' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="rounded-full bg-brand-primary/10 p-6">
                    <Loader2 className="h-10 w-10 text-brand-primary animate-spin" />
                  </div>
                  <div className="absolute -right-1 -top-1">
                    <Sparkles className="h-6 w-6 text-amber-500" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    Analyzing your PDF...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Extracting your experience and education
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
                  This usually takes a few seconds
                </div>
              </div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && parsedData && (
              <ImportReviewForm
                parsedData={parsedData}
                confidence={confidence}
                onConfirm={handleConfirm}
                onBack={handleBack}
                isSubmitting={currentStep === 'applying'}
              />
            )}

            {/* Applying Step */}
            {currentStep === 'applying' && (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="rounded-full bg-green-100 p-6">
                  <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900">
                    Saving your profile...
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Almost there!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Your data is encrypted and secure
          </p>
        </div>
      </div>

      {/* Help Modal */}
      <LinkedInPdfHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
      />
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function StepDot({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div
      className={cn(
        'w-3 h-3 rounded-full transition-all',
        active && 'bg-brand-primary scale-125',
        completed && !active && 'bg-brand-primary',
        !active && !completed && 'bg-gray-300'
      )}
    />
  );
}

function StepLine({ completed }: { completed: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 h-0.5 transition-colors',
        completed ? 'bg-brand-primary' : 'bg-gray-200'
      )}
    />
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getStepTitle(step: UploadStep, sourceType: string): string {
  switch (step) {
    case 'upload':
      return sourceType === 'linkedin' ? 'Upload LinkedIn PDF' : 'Upload Resume';
    case 'parsing':
      return 'Analyzing...';
    case 'review':
      return 'Review Information';
    case 'applying':
      return 'Saving Profile';
  }
}

function getStepDescription(step: UploadStep, sourceType: string): string {
  switch (step) {
    case 'upload':
      return sourceType === 'linkedin'
        ? 'We\'ll extract your work experience and education automatically'
        : 'We\'ll parse your resume to prefill your profile';
    case 'parsing':
      return 'Reading and extracting information from your PDF';
    case 'review':
      return 'Please verify the extracted information before continuing';
    case 'applying':
      return 'Updating your alumni profile';
  }
}
