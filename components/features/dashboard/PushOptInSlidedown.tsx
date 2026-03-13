'use client';

import { useState, useEffect } from 'react';
import { useOneSignalPush } from '@/lib/hooks/useOneSignalPush';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bell } from 'lucide-react';

const DISMISSED_KEY = 'push-optin-dismissed';

interface PushOptInSlidedownProps {
  /** When set, push state and requestPermission are available. */
  userId: string | undefined;
  /** Optional delay in ms before showing (e.g. 1500). */
  delayMs?: number;
  className?: string;
}

/**
 * Custom push opt-in prompt shown only on the dashboard when the user has not yet
 * granted or denied push. Uses our own UI; never calls OneSignal's slidedown.
 * "Subscribe" triggers the browser permission dialog via requestPermission().
 */
export function PushOptInSlidedown({ userId, delayMs = 0, className }: PushOptInSlidedownProps) {
  const { isPushSupported, permission, isLoading, requestPermission } = useOneSignalPush(userId);
  const [visible, setVisible] = useState(false);
  const [delayed, setDelayed] = useState(delayMs > 0);

  useEffect(() => {
    if (delayMs <= 0) {
      setDelayed(false);
      return;
    }
    const t = setTimeout(() => setDelayed(false), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === '1';
    const shouldShow =
      !isLoading &&
      !delayed &&
      isPushSupported &&
      permission === 'default' &&
      !dismissed &&
      !!userId;
    setVisible(shouldShow);
  }, [isLoading, delayed, isPushSupported, permission, userId]);

  const handleLater = () => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setVisible(false);
  };

  const handleSubscribe = () => {
    requestPermission();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed left-4 right-4 top-4 z-[250] mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:left-auto sm:right-4',
        className
      )}
      role="dialog"
      aria-describedby="push-optin-desc"
    >
      <div className="flex gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-primary/10 text-brand-primary">
          <Bell className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p id="push-optin-desc" className="text-sm text-gray-700">
            Subscribe to our notifications for the latest news and updates. You can disable anytime.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleLater}
              className="text-gray-600"
            >
              Later
            </Button>
            <Button type="button" size="sm" onClick={handleSubscribe}>
              Subscribe
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
