'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, ArrowLeft } from 'lucide-react';
import type { MyAttendanceEntry } from '@/types/events';

export default function MyAttendancePage() {
  const [attendance, setAttendance] = useState<MyAttendanceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchAttendance() {
      try {
        const res = await fetch('/api/attendance/me');
        if (!res.ok) {
          if (!cancelled) setError('Failed to load attendance');
          return;
        }
        const data = await res.json();
        if (!cancelled) setAttendance(data.data?.attendance ?? []);
      } catch {
        if (!cancelled) setError('Something went wrong');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAttendance();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

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

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>

      <Card className="border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CheckCircle className="h-6 w-6 text-brand-primary" />
            My attendance
          </CardTitle>
          <p className="text-sm text-gray-500">
            Events you have checked in to.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600 py-4">{error}</p>
          ) : attendance.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
              You haven&apos;t checked in to any events yet. Scan a QR code at an event to check in.
            </p>
          ) : (
            <ul className="space-y-3">
              {attendance.map((entry, index) => (
                <li
                  key={`${entry.event_id}-${entry.checked_in_at}-${index}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50"
                >
                  <Calendar className="h-5 w-5 text-brand-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">
                      {entry.event_title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(entry.event_start_time)} · Checked in at{' '}
                      {formatTime(entry.checked_in_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
