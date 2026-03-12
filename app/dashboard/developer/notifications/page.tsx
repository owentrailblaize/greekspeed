'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DeveloperPortal } from '@/components/features/dashboard/dashboards/DeveloperPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useAuth } from '@/lib/supabase/auth-context';
import { PUSH_EVENT_TYPES } from '@/lib/services/notificationPushPayload';
import { EMAIL_EVENT_TYPES, SMS_EVENT_TYPES, type NotificationType } from '@/lib/services/notificationTypes';
import { Bell, Loader2, ArrowLeft, Mail, Phone } from 'lucide-react';
import { toast } from 'react-toastify';
import { cn } from '@/lib/utils';

const CHANNELS = ['Push', 'Email', 'SMS'] as const;
type Channel = (typeof CHANNELS)[number];

const EVENT_TYPE_LABELS: Record<string, string> = {
  chapter_announcement: 'Chapter Announcement',
  new_event: 'New Event',
  event_reminder: 'Event Reminder',
  connection_request: 'Connection Request',
  connection_accepted: 'Connection Accepted',
  new_message: 'New Message',
  post_comment: 'Post Comment',
  comment_reply: 'Comment Reply',
  system_alert: 'System Alert',
  welcome: 'Welcome',
  generic_notification: 'Generic Notification',
  password_reset_template: 'Password Reset',
  password_change: 'Password Change',
};

function formatPhoneInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');

  if (!digits) return hasPlus ? '+' : '';

  const base = (hasPlus ? '+' : '') + digits;

  if (!hasPlus && digits.length === 10) {
    return `+1${digits}`;
  }

  return base;
}

export default function DeveloperNotificationsPage() {
  return (
    <DeveloperNotificationsPageContent />
  );
}

function DeveloperNotificationsPageContent() {
  const router = useRouter();
  const { profile, isDeveloper } = useProfile();
  const { session } = useAuth();

  const [channel, setChannel] = useState<Channel>('Push');
  const [eventType, setEventType] = useState<string>('');
  const [userId, setUserId] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [toPhone, setToPhone] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [customBody, setCustomBody] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  useEffect(() => {
    if (profile && !isDeveloper) {
      toast.error('Access denied. Developer access required.');
      router.push('/dashboard');
    }
  }, [profile, isDeveloper, router]);

  useEffect(() => {
    setEventType('');
    setLastResult(null);
    setToPhone('');
  }, [channel]);

  const showOptionalContext =
    eventType === 'system_alert' || eventType === 'generic_notification';

  const handleSendTestPush = async () => {
    if (!eventType || !userId.trim()) {
      toast.error('Select an event type and enter a user ID.');
      return;
    }
    if (!session?.access_token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const body: {
        eventType: NotificationType;
        userId: string;
        context?: { title?: string; body?: string };
      } = {
        eventType: eventType as NotificationType,
        userId: userId.trim(),
      };
      if (showOptionalContext && (customTitle || customBody)) {
        body.context = {};
        if (customTitle.trim()) body.context.title = customTitle.trim();
        if (customBody.trim()) body.context.body = customBody.trim();
      }

      const res = await fetch('/api/developer/notifications/test-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setLastResult({ success: true, message: data.message ?? 'Sent' });
        toast.success(data.message ?? 'Push sent successfully.');
      } else {
        const err = data.error ?? res.statusText ?? 'Failed to send push';
        setLastResult({ success: false, error: err });
        toast.error(err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setLastResult({ success: false, error: message });
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!eventType || !toEmail.trim()) {
      toast.error('Select an event type and enter an email address.');
      return;
    }
    if (!session?.access_token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/developer/notifications/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventType: eventType as NotificationType,
          toEmail: toEmail.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setLastResult({ success: true, message: data.message ?? 'Sent' });
        toast.success(data.message ?? 'Test email sent successfully.');
      } else {
        const err = data.error ?? res.statusText ?? 'Failed to send email';
        setLastResult({ success: false, error: err });
        toast.error(err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setLastResult({ success: false, error: message });
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!eventType || !toPhone.trim()) {
      toast.error('Select an event type and enter a phone number.');
      return;
    }
    if (!session?.access_token) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    setSending(true);
    setLastResult(null);

    try {
      const res = await fetch('/api/developer/notifications/test-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          eventType: eventType as NotificationType,
          toPhone: toPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        setLastResult({ success: true, message: data.message ?? 'Sent' });
        toast.success(data.message ?? 'Test SMS sent successfully.');
      } else {
        const err = data.error ?? res.statusText ?? 'Failed to send SMS';
        setLastResult({ success: false, error: err });
        toast.error(err);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Request failed';
      setLastResult({ success: false, error: message });
      toast.error(message);
    } finally {
      setSending(false);
    }
  };

  if (profile && !isDeveloper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              You do not have permission to access the developer notification testing page.
            </p>
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DeveloperPortal>
      <div className="min-h-full bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold text-gray-900">Test Notifications</h1>
            </div>
            <p className="text-gray-600 mt-1">
              Send test push, email, or SMS notifications by event type. Choose channel, then event type and recipient.
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {channel === 'Push' ? (
                  <Bell className="h-5 w-5" />
                ) : channel === 'Email' ? (
                  <Mail className="h-5 w-5" />
                ) : (
                  <Phone className="h-5 w-5" />
                )}
                <span>
                  {channel === 'Push'
                    ? 'Send test push'
                    : channel === 'Email'
                    ? 'Send test email'
                    : 'Send test SMS'}
                </span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {channel === 'Push'
                  ? 'Choose event type and user ID. Push uses sample context unless you override title/body for system_alert or generic_notification.'
                  : channel === 'Email'
                  ? 'Choose event type and recipient email. Uses the same sample data as the CLI test script.'
                  : 'Choose event type and phone number. Uses the same sample SMS data as the CLI test script.'}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Channel</Label>
                <Select
                  value={channel}
                  onValueChange={(v) => setChannel(v as Channel)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Push">Push</SelectItem>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">All channels use sample context consistent with the CLI test runner.</p>
              </div>

              <div>
                <Label>Event type</Label>
                <Select
                  value={eventType}
                  onValueChange={setEventType}
                  placeholder={
                    channel === 'Push'
                      ? 'Select push event type'
                      : channel === 'Email'
                      ? 'Select email event type'
                      : 'Select SMS event type'
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue
                      placeholder={
                        channel === 'Push'
                          ? 'Select push event type'
                          : channel === 'Email'
                          ? 'Select email event type'
                          : 'Select SMS event type'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(channel === 'Push'
                      ? PUSH_EVENT_TYPES
                      : channel === 'Email'
                      ? EMAIL_EVENT_TYPES
                      : SMS_EVENT_TYPES
                    ).map((type) => (
                      <SelectItem key={type} value={type}>
                        {EVENT_TYPE_LABELS[type] ?? type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {channel === 'Push' && (
                <>
                  <div>
                    <Label htmlFor="userId">User ID (recipient)</Label>
                    <Input
                      id="userId"
                      value={userId}
                      onChange={(e) => setUserId(e.target.value)}
                      placeholder="App user UUID (e.g. from profiles)"
                      className="mt-1 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The user must have an active push subscription to receive the notification.
                    </p>
                  </div>

                  {showOptionalContext && (
                    <>
                      <div>
                        <Label htmlFor="customTitle">Custom title (optional)</Label>
                        <Input
                          id="customTitle"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                          placeholder="Override notification title"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customBody">Custom body (optional)</Label>
                        <Input
                          id="customBody"
                          value={customBody}
                          onChange={(e) => setCustomBody(e.target.value)}
                          placeholder="Override notification body"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {channel === 'Email' && (
                <div>
                  <Label htmlFor="toEmail">Email address (recipient)</Label>
                  <Input
                    id="toEmail"
                    type="email"
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    placeholder="e.g. test@example.com"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Test email will be sent to this address using sample template data.
                  </p>
                </div>
              )}

              {channel === 'SMS' && (
                <div>
                  <Label htmlFor="toPhone">Phone number (recipient)</Label>
                  <Input
                    id="toPhone"
                    type="tel"
                    value={toPhone}
                    onChange={(e) => setToPhone(formatPhoneInput(e.target.value))}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid mobile number. Input is auto-formatted toward E.164 (e.g. +15551234567).
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={
                    channel === 'Push'
                      ? handleSendTestPush
                      : channel === 'Email'
                      ? handleSendTestEmail
                      : handleSendTestSms
                  }
                  disabled={
                    sending ||
                    !eventType ||
                    (channel === 'Push'
                      ? !userId.trim()
                      : channel === 'Email'
                      ? !toEmail.trim()
                      : !toPhone.trim())
                  }
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : channel === 'Push' ? (
                    'Send test push'
                  ) : channel === 'Email' ? (
                    'Send test email'
                  ) : (
                    'Send test SMS'
                  )}
                </Button>
              </div>

              {lastResult && (
                <div
                  className={cn(
                    'rounded-lg border p-3 text-sm',
                    lastResult.success
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : 'border-red-200 bg-red-50 text-red-800'
                  )}
                >
                  {lastResult.success ? (
                    <span>{lastResult.message ?? 'Sent.'}</span>
                  ) : (
                    <span>Failed: {lastResult.error}</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DeveloperPortal>
  );
}
