'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { validateUsername } from '@/lib/utils/usernameUtils';
import { cn } from '@/lib/utils';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (valid: boolean) => void;
  excludeUserId?: string;
  firstName?: string;
  lastName?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

type AvailabilityState = 'idle' | 'checking' | 'available' | 'unavailable' | 'error';

export function UsernameInput({
  value,
  onChange,
  onValidationChange,
  excludeUserId,
  firstName,
  lastName,
  error: externalError,
  disabled = false,
  className,
}: UsernameInputProps) {
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState>('idle');
  const [validationError, setValidationError] = useState<string>('');
  const [isChecking, setIsChecking] = useState(false);

  // Debounced availability check
  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setAvailabilityState('idle');
      setValidationError('');
      onValidationChange?.(false);
      return;
    }

    // First validate format
    const validation = validateUsername(value);
    if (!validation.valid) {
      setAvailabilityState('error');
      setValidationError(validation.error || 'Invalid username');
      onValidationChange?.(false);
      return;
    }

    setValidationError('');
    
    // Debounce availability check
    const timeoutId = setTimeout(async () => {
      setIsChecking(true);
      setAvailabilityState('checking');

      try {
        const params = new URLSearchParams({ username: value });
        if (excludeUserId) {
          params.append('excludeUserId', excludeUserId);
        }

        const response = await fetch(`/api/username/check?${params.toString()}`);
        const data = await response.json();

        if (response.ok) {
          if (data.available) {
            setAvailabilityState('available');
            setValidationError('');
            onValidationChange?.(true);
          } else {
            setAvailabilityState('unavailable');
            setValidationError(data.message || 'Username is already taken');
            onValidationChange?.(false);
          }
        } else {
          setAvailabilityState('error');
          setValidationError(data.error || 'Failed to check availability');
          onValidationChange?.(false);
        }
      } catch (err) {
        setAvailabilityState('error');
        setValidationError('Failed to check username availability');
        onValidationChange?.(false);
      } finally {
        setIsChecking(false);
      }
    }, 800); // 800ms debounce

    return () => clearTimeout(timeoutId);
  }, [value, excludeUserId, onValidationChange]);

  const displayError = externalError || validationError;
  const hasError = !!displayError;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor="username" className="flex items-center gap-2">
        Username
        <span className="text-xs text-gray-500 font-normal">(for your profile URL)</span>
      </Label>
      <div className="relative">
        <Input
          id="username"
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.toLowerCase().trim();
            onChange(newValue);
          }}
          placeholder="john.doe"
          className={cn(
            'pr-10',
            hasError && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            availabilityState === 'available' && 'border-green-500 focus:border-green-500',
            availabilityState === 'checking' && 'border-blue-500'
          )}
          disabled={disabled || isChecking}
          maxLength={50}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isChecking && (
            <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
          )}
          {!isChecking && availabilityState === 'available' && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {!isChecking && availabilityState === 'unavailable' && (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          {!isChecking && availabilityState === 'error' && (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </div>
      
      {/* Profile URL Preview */}
      {value && availabilityState === 'available' && (
        <p className="text-xs text-gray-500">
          Your profile will be at: <span className="font-mono text-gray-700">trailblaize.net/profile/{value}</span>
        </p>
      )}

      {/* Error Messages */}
      {displayError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {displayError}
        </p>
      )}

      {/* Helper Text */}
      {!displayError && value && availabilityState !== 'available' && (
        <p className="text-xs text-gray-500">
          Username can contain lowercase letters, numbers, hyphens, and dots. 3-50 characters.
        </p>
      )}
    </div>
  );
}

