'use client';

import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import { supabase } from '@/lib/supabase/client';
import type {
  AttendanceWithProfile,
  EventCheckInQrResponse,
} from '@/types/events';

interface EventAttendanceBlockProps {
  eventId: string;
  chapterId: string;
  eventTitle?: string;
  /** When true, use a more compact layout (e.g. inside EventDetailModal) */
  compact?: boolean;
}

export function EventAttendanceBlock({
  eventId,
  chapterId,
  eventTitle,
  compact = false,
}: EventAttendanceBlockProps) {
  const { getAuthHeaders } = useAuth();
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [qrError, setQrError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceWithProfile[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setQrPayload(null);
      setCheckInUrl(null);
      setQrError(null);
      setQrLoading(false);
      return;
    }
    let cancelled = false;
    async function fetchQr() {
      setQrLoading(true);
      setQrError(null);
      try {
        const headers: Record<string, string> = {};
        const authHeaders = getAuthHeaders();
        if (authHeaders.Authorization) {
          headers.Authorization = authHeaders.Authorization;
        }
        const res = await fetch(`/api/events/${eventId}/check-in-qr`, {
          headers,
          credentials: 'include',
        });
        const raw = (await res.json()) as
          | EventCheckInQrResponse
          | { error?: string };
        if (!cancelled && res.ok && 'data' in raw && raw.data) {
          const v = raw.data.qr_value?.trim();
          const u = raw.data.check_in_url?.trim();
          setQrPayload(v || null);
          setCheckInUrl(u || null);
          if (!v || !u) {
            setQrError('Check-in codes were incomplete. Try again.');
          }
        } else if (!cancelled) {
          setQrPayload(null);
          setCheckInUrl(null);
          const msg =
            typeof raw === 'object' && raw && 'error' in raw && raw.error
              ? String(raw.error)
              : 'Could not load check-in codes';
          setQrError(msg);
        }
      } catch {
        if (!cancelled) {
          setQrPayload(null);
          setCheckInUrl(null);
          setQrError('Could not load check-in codes');
        }
      } finally {
        if (!cancelled) setQrLoading(false);
      }
    }
    fetchQr();
    return () => {
      cancelled = true;
    };
  }, [eventId, getAuthHeaders]);

  const fetchAttendance = useCallback(async () => {
    setLoadingAttendance(true);
    try {
      const headers: Record<string, string> = {};
      const authHeaders = getAuthHeaders();
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      const res = await fetch(`/api/events/${eventId}/attendance`, {
        headers,
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setAttendance(data.data?.attendance ?? []);
      } else {
        setAttendance([]);
      }
    } catch {
      setAttendance([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [eventId, getAuthHeaders]);

  useEffect(() => {
    if (eventId) void fetchAttendance();
  }, [eventId, fetchAttendance]);

  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event-attendance:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          fetchAttendance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, fetchAttendance]);

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return iso;
    }
  };

  if (qrLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-32 w-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (qrError || !qrPayload || !checkInUrl) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-600 text-center">
          {qrError || 'Check-in codes are unavailable.'}
        </p>
      </div>
    );
  }

  const appQrSize = compact ? 112 : 152;
  const cameraQrSize = compact ? 112 : 152;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div
        className={
          compact
            ? 'flex flex-wrap gap-4 items-start'
            : 'grid grid-cols-1 sm:grid-cols-2 gap-6'
        }
      >
        <div className="flex flex-col items-center flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 mb-1.5 text-center">
            In Trailblaize app
          </p>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <QRCodeSVG value={qrPayload} size={appQrSize} level="M" />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center max-w-[11rem]">
            Open this event, tap Check in, then scan this code.
          </p>
        </div>
        <div className="flex flex-col items-center flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-800 mb-1.5 text-center">
            Phone camera
          </p>
          <div className="bg-white p-2 rounded-lg border border-gray-200">
            <QRCodeSVG
              value={checkInUrl}
              size={cameraQrSize}
              level="L"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center max-w-[11rem]">
            Scan with the Camera app to open web check-in.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-primary" />
            Checked in ({attendance.length})
          </h4>
        </div>
        {loadingAttendance && attendance.length === 0 ? (
          <div className="py-4 flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-primary" />
          </div>
        ) : attendance.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No check-ins yet.</p>
        ) : (
          <ul className={`space-y-1.5 ${compact ? 'max-h-32 overflow-y-auto' : 'max-h-48 overflow-y-auto'}`}>
            {attendance.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 text-sm text-gray-700"
              >
                {a.avatar_url ? (
                  <img
                    src={a.avatar_url}
                    alt=""
                    className="h-6 w-6 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-xs font-medium text-brand-primary flex-shrink-0">
                    {(a.first_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <span className="truncate">
                  {[a.first_name, a.last_name].filter(Boolean).join(' ') || 'Unknown'}
                </span>
                <span className="text-gray-400 text-xs flex-shrink-0 ml-auto">
                  {formatTime(a.checked_in_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
