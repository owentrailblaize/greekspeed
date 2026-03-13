import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import { runNotificationTest } from '@/lib/services/notificationTestRunner';
import { SMS_EVENT_TYPES, type NotificationType } from '@/lib/services/notificationTypes';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

async function authenticateRequest(request: NextRequest) {
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      return {
        user,
        supabase: createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!),
      };
    }
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    return {
      user,
      supabase: createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!),
    };
  } catch {
    return null;
  }
}

export interface TestSmsRequestBody {
  eventType: NotificationType;
  toPhone: string;
}

/**
 * POST /api/developer/notifications/test-sms
 * Send a test SMS for the given event type to the given phone number. Developer-only.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { user, supabase } = auth;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_developer')
      .eq('id', user.id)
      .single();

    if (!profile || !canAccessDeveloperPortal(profile)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Developer access required.' },
        { status: 403 }
      );
    }

    let body: TestSmsRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { eventType, toPhone } = body;

    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }
    if (!toPhone || typeof toPhone !== 'string') {
      return NextResponse.json({ error: 'toPhone is required' }, { status: 400 });
    }

    const trimmedPhone = toPhone.trim();
    if (!trimmedPhone) {
      return NextResponse.json({ error: 'toPhone is required' }, { status: 400 });
    }

    const isValidEventType = (SMS_EVENT_TYPES as readonly string[]).includes(eventType);
    if (!isValidEventType) {
      return NextResponse.json(
        {
          error: `Invalid eventType. Must be one of: ${SMS_EVENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result = await runNotificationTest({
      type: eventType as NotificationType,
      toEmail: '',
      toPhone: trimmedPhone,
      sendEmail: false,
      sendSms: true,
      dryRun: false,
    });

    const sendResult = result as { smsSent?: boolean; smsError?: string };
    if (sendResult.smsSent) {
      return NextResponse.json({
        success: true,
        message: 'Test SMS sent successfully.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: sendResult.smsError ?? 'Failed to send test SMS',
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[test-sms]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

