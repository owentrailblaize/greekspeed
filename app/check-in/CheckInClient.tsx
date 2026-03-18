'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

interface CheckInClientProps {
  eventId: string;
}

export function CheckInClient({ eventId }: CheckInClientProps) {
  const router = useRouter();
  const [eventTitle, setEventTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchEvent() {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        if (!res.ok) {
          if (res.status === 401) setUnauthorized(true);
          if (!cancelled) setEventTitle(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setEventTitle(data.title ?? null);
      } catch {
        if (!cancelled) setEventTitle(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchEvent();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  useEffect(() => {
    if (unauthorized) {
      const returnTo = `/check-in?event=${encodeURIComponent(eventId)}`;
      router.replace(`/sign-in?redirect=${encodeURIComponent(returnTo)}`);
    }
  }, [unauthorized, eventId, router]);

  const handleCheckIn = async () => {
    setError(null);
    setCheckingIn(true);
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          setUnauthorized(true);
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

  if (unauthorized) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <p className="text-gray-500">Redirecting to sign in...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">
        {eventTitle || 'Event check-in'}
      </h1>
      {eventTitle && (
        <p className="text-sm text-gray-500 text-center mb-6">
          Scan the QR code or open this page to check in.
        </p>
      )}

      {success ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle className="h-14 w-14 text-green-600" />
          <p className="text-lg font-medium text-gray-900">You&apos;re checked in!</p>
          <p className="text-sm text-gray-500">Thanks for attending.</p>
        </div>
      ) : (
        <>
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="w-full h-12 text-base bg-brand-primary hover:bg-brand-primary-hover"
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
            <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
