'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { logger } from "@/lib/utils/logger";

interface ChangePasswordFormProps {
  showBackButton?: boolean;
  onBack?: () => void;
  onSuccess?: () => void;
  className?: string;
  resetToken?: string;
}

export function ChangePasswordForm({ 
  showBackButton = false, 
  onBack, 
  onSuccess,
  className = "",
  resetToken
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // State for password validation
  const [currentPasswordValid, setCurrentPasswordValid] = useState<boolean | null>(null);
  const [validatingCurrentPassword, setValidatingCurrentPassword] = useState(false);
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  
  // State for password matching validation
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [passwordMatchError, setPasswordMatchError] = useState('');
  
  const { session } = useAuth();

  // Debounced password validation
  useEffect(() => {
    if (!resetToken && currentPassword.length > 0) {
      const timeoutId = setTimeout(() => {
        validateCurrentPassword();
      }, 500); // 500ms delay

      return () => clearTimeout(timeoutId);
    } else if (!resetToken && currentPassword.length === 0) {
      // Reset validation state when password is cleared
      setCurrentPasswordValid(null);
      setCurrentPasswordError('');
    }
  }, [currentPassword, resetToken]);

  // Real-time password matching validation
  useEffect(() => {
    if (newPassword.length > 0 && confirmPassword.length > 0) {
      if (newPassword === confirmPassword) {
        setPasswordsMatch(true);
        setPasswordMatchError('');
      } else {
        setPasswordsMatch(false);
        setPasswordMatchError('Passwords do not match');
      }
    } else if (newPassword.length === 0 && confirmPassword.length === 0) {
      // Reset validation state when both fields are cleared
      setPasswordsMatch(null);
      setPasswordMatchError('');
    } else if (confirmPassword.length > 0 && newPassword.length === 0) {
      // If confirm password has content but new password is empty
      setPasswordsMatch(false);
      setPasswordMatchError('Please enter a new password first');
    } else if (newPassword.length > 0 && confirmPassword.length === 0) {
      // If new password has content but confirm password is empty
      setPasswordsMatch(null);
      setPasswordMatchError('');
    }
  }, [newPassword, confirmPassword]);

  const validateCurrentPassword = async () => {
    if (!session?.user?.email || !currentPassword) {
      setCurrentPasswordValid(null);
      return;
    }

    setValidatingCurrentPassword(true);
    setCurrentPasswordError('');

    try {
      const response = await fetch('/api/auth/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ password: currentPassword }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setCurrentPasswordValid(true);
        setCurrentPasswordError('');
      } else {
        setCurrentPasswordValid(false);
        setCurrentPasswordError(data.error || 'Invalid password');
      }
    } catch (error) {
      logger.error('Password validation error:', { context: [error] });
      setCurrentPasswordValid(false);
      setCurrentPasswordError('Failed to validate password');
    } finally {
      setValidatingCurrentPassword(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // Only validate current password if NOT in reset mode
    if (!resetToken && !currentPassword) {
      setError('Current password is required');
      return;
    }

    // Check if current password is valid (only in change password mode)
    if (!resetToken && currentPasswordValid !== true) {
      setError('Please enter a valid current password');
      return;
    }

    // Check if passwords match
    if (passwordsMatch !== true) {
      setError('Please ensure passwords match');
      return;
    }

    setLoading(true);

    try {
      const endpoint = resetToken ? '/api/auth/reset-password' : '/api/auth/change-password';
      const body = resetToken 
        ? { newPassword }
        : { currentPassword, newPassword };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include Authorization header for both flows
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully! You will receive a confirmation email.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPasswordValid(null); // Reset validation state
      setPasswordsMatch(null); // Reset password match state

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }

    } catch (error) {
      logger.error('Password change error:', { context: [error] });
      setError(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      {showBackButton && (
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          className="text-gray-600 hover:text-gray-900 rounded-full mb-4"
          style={{ borderRadius: '100px' }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
        <p className="text-gray-600">Create a new password that is at least 8 characters long.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!resetToken && (
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required={!resetToken}
                disabled={loading}
                className={`pr-20 ${
                  currentPasswordValid === true 
                    ? 'border-green-500 focus:border-green-500' 
                    : currentPasswordValid === false 
                    ? 'border-red-500 focus:border-red-500' 
                    : ''
                }`}
              />
              
              {/* Validation indicator - positioned to the left of eye icon */}
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                {validatingCurrentPassword ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : currentPasswordValid === true ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : currentPasswordValid === false ? (
                  <X className="w-4 h-4 text-red-500" />
                ) : null}
              </div>

              {/* Password visibility toggle - original button style */}
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            
            {/* Current password error message */}
            {currentPasswordError && (
              <p className="text-red-500 text-sm">{currentPasswordError}</p>
            )}
          </div>
        )}

        <div>
          <Label htmlFor="new-password">New Password <span className="text-red-400">*</span></Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              className={`pr-12 ${
                newPassword.length >= 8 
                  ? 'border-green-500 focus:border-green-500' 
                  : newPassword.length > 0 && newPassword.length < 8
                  ? 'border-red-500 focus:border-red-500' 
                  : ''
              }`}
            />
            <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Password length indicator */}
          {newPassword.length > 0 && (
            <p className={`text-sm ${
              newPassword.length >= 8 ? 'text-green-600' : 'text-red-500'
            }`}>
              {newPassword.length >= 8 ? '✓ Password length is valid' : `${newPassword.length}/8 characters minimum`}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirm New Password <span className="text-red-400">*</span></Label>
          <div className="relative">
            <Input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              className={`pr-20 ${
                passwordsMatch === true 
                  ? 'border-green-500 focus:border-green-500' 
                  : passwordsMatch === false 
                  ? 'border-red-500 focus:border-red-500' 
                  : ''
              }`}
            />
            
            {/* Password match indicator - positioned to the left of eye icon */}
            <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
              {passwordsMatch === true ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : passwordsMatch === false ? (
                <X className="w-4 h-4 text-red-500" />
              ) : null}
            </div>

            {/* Password visibility toggle - original button style */}
            <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          
          {/* Password match error message */}
          {passwordMatchError && (
            <p className="text-red-500 text-sm">{passwordMatchError}</p>
          )}
        </div>

        {success && (
          <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-lg p-3">
            {success}
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full max-w-xs mx-auto block rounded-full" 
          style={{ borderRadius: '100px' }}
          disabled={
            loading || 
            (!resetToken && !currentPassword) || 
            (!resetToken && currentPasswordValid !== true) ||
            !newPassword || 
            !confirmPassword ||
            passwordsMatch !== true ||
            newPassword.length < 8
          }
        >
          {loading ? 'Changing Password...' : 'Save password'}
        </Button>
      </form>
    </div>
  );
}
