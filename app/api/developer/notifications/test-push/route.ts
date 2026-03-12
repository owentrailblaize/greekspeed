import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { canAccessDeveloperPortal } from '@/lib/developerPermissions';
import { buildPushPayload, getSamplePushContext, PUSH_EVENT_TYPES } from '@/lib/services/notificationPushPayload';
import type { NotificationPushContext } from '@/lib/services/notificationPushPayload';
import type { NotificationType } from '@/lib/services/notificationTypes';
import { sendPushToUser } from '@/lib/services/oneSignalPushService';

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

export interface TestPushRequestBody {
  eventType: NotificationType;
  userId: string;
  context?: Partial<NotificationPushContext>;
}

/**
 * POST /api/developer/notifications/test-push
 * Send a test push notification to a user. Developer-only.
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

    let body: TestPushRequestBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { eventType, userId, context: contextOverrides } = body;

    if (!eventType || typeof eventType !== 'string') {
      return NextResponse.json({ error: 'eventType is required' }, { status: 400 });
    }
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const isValidEventType = (PUSH_EVENT_TYPES as readonly string[]).includes(eventType);
    if (!isValidEventType) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${PUSH_EVENT_TYPES.join(', ')}` },
        { status: 400 }
      );
    }

    const context = getSamplePushContext(eventType as NotificationType, contextOverrides);
    const payload = buildPushPayload(eventType as NotificationType, context);
    const result = await sendPushToUser(userId, payload);

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'Push sent successfully.',
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: result.error ?? 'Failed to send push',
        invalidSubscriptionIds: result.invalidSubscriptionIds,
      },
      { status: 422 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[test-push]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
