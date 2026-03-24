'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, LogIn, Calendar, MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { Event } from '@/types/events';

/** `public` = `/check-in` (camera QR, no dashboard chrome). `dashboard` = in-app fallback. */
export type CheckInReturnPathBase = 'public' | 'dashboard';

interface CheckInClientProps {
  eventId: string;
  /** When set (camera / printed QR link), sent as `url_check_in_token` on POST. */
  urlCheckInToken?: string;
  /** Base path for post–sign-in return and 401 recovery. Default `dashboard`. */
  returnPathBase?: CheckInReturnPathBase;
}

function buildCheckInReturnPath(
  eventId: string,
  urlCheckInToken: string | undefined,
  returnPathBase: CheckInReturnPathBase
): string {
  const base =
    returnPathBase === 'public' ? '/check-in' : '/dashboard/check-in';
  const eventQ = encodeURIComponent(eventId);
  if (urlCheckInToken) {
    return `${base}?event=${eventQ}&t=${encodeURIComponent(urlCheckInToken)}`;
  }
  return `${base}?event=${eventQ}`;
}

function formatEventDate(startTime: string): string {
  const start = new Date(startTime);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return start.toLocaleDateString('en-US', options);
}

function formatEventTime(startTime: string, endTime: string): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const startStr = start.toLocaleTimeString('en-US', options);
  const endStr = end.toLocaleTimeString('en-US', options);
  return `${startStr} - ${endStr}`;
}

export function CheckInClient({
  eventId,
  urlCheckInToken,
  returnPathBase = 'dashboard',
}: CheckInClientProps) {
  const router = useRouter();
  const { user, getAuthHeaders, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          if (!cancelled) setEvent(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setEvent(data);
      } catch {
        if (!cancelled) setEvent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const goToSignIn = () => {
    const returnTo = buildCheckInReturnPath(
      eventId,
      urlCheckInToken,
      returnPathBase
    );
    router.replace(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
  };

  const handleCheckIn = async () => {
    setError(null);
    setCheckingIn(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const authHeaders = getAuthHeaders();
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      const body =
        urlCheckInToken != null && urlCheckInToken !== ''
          ? JSON.stringify({ url_check_in_token: urlCheckInToken })
          : undefined;
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          goToSignIn();
          return;
        }
        setError(data.error || 'Check-in failed');
        return;
      }
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  // No event found
  if (!event) {
    return (
      <div className="w-full max-w-sm">
        <p className="text-center text-gray-500 pt-6">Event not found.</p>
      </div>
    );
  }

  const eventTitle = event.title || 'Event check-in';
  const descriptionExcerpt = event.description
    ? event.description.length > 120
      ? `${event.description.slice(0, 120).trim()}…`
      : event.description
    : null;

  return (
    <div className="w-full max-w-sm">
      <div className="pb-2">
        <div className="flex flex-col items-center text-center">
          <Calendar className="h-12 w-12 text-brand-primary mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">
            {eventTitle}
          </h1>
          {event.start_time && event.end_time && (
            <div className="flex flex-col items-center gap-1 mt-3 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                <span>{formatEventDate(event.start_time)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 flex-shrink-0 text-brand-primary" />
                <span>{formatEventTime(event.start_time, event.end_time)}</span>
              </div>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4 flex-shrink-0 text-brand-primary" />
              <span>{event.location}</span>
            </div>
          )}
          {descriptionExcerpt && (
            <p className="mt-3 text-sm text-gray-500 text-center w-full line-clamp-2">
              {descriptionExcerpt}
            </p>
          )}
        </div>
      </div>
      <div className="pt-2 pb-6">
        {success ? (
          <div className="flex flex-col items-center gap-3 text-center py-4">
            <CheckCircle className="h-14 w-14 text-green-600" />
            <p className="text-lg font-medium text-gray-900">You&apos;re checked in!</p>
            <p className="text-sm text-gray-500">Thanks for attending.</p>
          </div>
        ) : !authLoading && !user ? (
          <div className="flex flex-col items-center gap-4">
            <p className="text-sm text-gray-600 text-center">
              Sign in to check in for this event.
            </p>
            <Button
              onClick={goToSignIn}
              className="w-full h-12 text-base bg-brand-primary hover:bg-brand-primary-hover rounded-full"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Sign in to check in
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              {returnPathBase === 'public'
                ? 'Tap below to complete check-in.'
                : 'Scan the QR code or tap below to check in.'}
            </p>
            <Button
              onClick={handleCheckIn}
              disabled={checkingIn}
              className="w-full h-12 text-base bg-brand-primary hover:bg-brand-primary-hover rounded-full"
            >
              {checkingIn ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Checking in...
                </>
              ) : (
                'Check in'
              )}
            </Button>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
