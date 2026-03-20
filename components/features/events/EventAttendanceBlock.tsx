'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Users, RefreshCw } from 'lucide-react';
import { useAuth } from '@/lib/supabase/auth-context';
import type { AttendanceWithProfile } from '@/types/events';

interface EventAttendanceBlockProps {
  eventId: string;
  eventTitle?: string;
  /** When true, use a more compact layout (e.g. inside EventDetailModal) */
  compact?: boolean;
}

export function EventAttendanceBlock({
  eventId,
  eventTitle,
  compact = false,
}: EventAttendanceBlockProps) {
  const { getAuthHeaders } = useAuth();
  const [checkInUrl, setCheckInUrl] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<AttendanceWithProfile[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  useEffect(() => {
    setCheckInUrl(
      typeof window !== 'undefined'
        ? `${window.location.origin}/check-in?event=${encodeURIComponent(eventId)}`
        : null
    );
  }, [eventId]);

  const fetchAttendance = async () => {
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
  };

  useEffect(() => {
    if (eventId) void fetchAttendance();
  }, [eventId]);

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

  if (!checkInUrl) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="h-32 w-32 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'flex items-start gap-4' : 'flex flex-col items-center'}>
        <div className="flex-shrink-0 bg-white p-2 rounded-lg border border-gray-200">
          <QRCodeSVG value={checkInUrl} size={compact ? 120 : 160} level="M" />
        </div>
        <div className={compact ? 'flex-1 min-w-0' : 'text-center mt-2'}>
          <p className="text-sm text-gray-600">
            Members scan this code to check in.
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-primary" />
            Checked in ({attendance.length})
          </h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchAttendance}
            disabled={loadingAttendance}
            className="h-8 px-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${loadingAttendance ? 'animate-spin' : ''}`}
            />
          </Button>
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
