'use client';

import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [isValidToken, setIsValidToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if there's a valid reset token in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      // TODO: Validate the reset token with your backend
      setIsValidToken(true);
    }
    
    setLoading(false);
  }, []);

  const handleSuccess = () => {
    // Redirect to login page after successful password reset
    router.push('/auth/sign-in');
  };

  const handleBack = () => {
    router.push('/auth/sign-in');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Reset Link</h1>
          <p className="text-gray-600 mb-6">This password reset link is invalid or has expired.</p>
          <button
            onClick={() => router.push('/auth/sign-in')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 flex items-center justify-center">
      <div className="max-w-md mx-auto px-6">
        <ChangePasswordForm
          showBackButton={true}
          onBack={handleBack}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}
