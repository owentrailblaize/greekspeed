'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ChangePasswordForm } from '@/components/settings/ChangePasswordForm';
import { supabase } from '@/lib/supabase/client'; // Use the supabase instance, not createClient

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      // Check for Supabase access token in URL hash
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        try {
          // Set the session with the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Token validation error:', error);
            setError('Invalid or expired reset link');
            setIsValid(false);
          } else {
            setIsValid(true);
          }
        } catch (error) {
          console.error('Token validation error:', error);
          setError('Invalid or expired reset link');
          setIsValid(false);
        }
      } else {
        // Check for traditional token parameter
        const token = searchParams.get('token');
        if (token) {
          setIsValid(true);
        } else {
          setError('Invalid or expired reset link');
          setIsValid(false);
        }
      }
      
      setIsValidating(false);
    };

    validateToken();
  }, [searchParams]);

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isValid || error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h1>
          <p className="text-gray-600">{error || 'This password reset link is invalid or has expired.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>
        
        <ChangePasswordForm 
          showBackButton={false}
          resetToken="reset"  // Add this line to hide current password field
          onSuccess={() => {
            // Redirect to sign in after successful password reset
            window.location.href = '/sign-in';
          }}
        />
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
