/**
 * Server-side: send push notifications via OneSignal REST API.
 * Resolves app user IDs to OneSignal subscription (player) IDs from push_subscriptions.
 */

import { createClient } from '@supabase/supabase-js';

const ONESIGNAL_API = 'https://api.onesignal.com/notifications';

export interface OneSignalPushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
}

export interface OneSignalSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  invalidSubscriptionIds?: string[];
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getAppId(): string | null {
  const isDev = process.env.NODE_ENV === 'development';
  const appId = isDev
    ? process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID_DEV
    : process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  return appId ?? null;
}

/**
 * Fetch OneSignal subscription (player) IDs for one user from push_subscriptions.
 */
export async function getPlayerIdsForUser(userId: string): Promise<string[]> {
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('onesignal_player_id')
    .eq('user_id', userId);

  if (error) return [];
  return (rows ?? []).map((r) => r.onesignal_player_id).filter(Boolean);
}

/**
 * Fetch OneSignal subscription IDs for multiple users (deduplicated).
 */
export async function getPlayerIdsForUsers(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const supabase = getSupabase();
  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('onesignal_player_id')
    .in('user_id', userIds);

  if (error) return [];
  const set = new Set<string>();
  for (const r of rows ?? []) {
    if (r.onesignal_player_id) set.add(r.onesignal_player_id);
  }
  return Array.from(set);
}

/**
 * Send push to specific subscription IDs via OneSignal REST API.
 * Max 20,000 IDs per request (OneSignal limit).
 */
export async function sendPushToSubscriptions(
  subscriptionIds: string[],
  payload: OneSignalPushPayload
): Promise<OneSignalSendResult> {
  const apiKey = process.env.ONE_SIGNAL_REST_API_KEY;
  const appId = getAppId();

  if (!apiKey || !appId) {
    console.error('[Push] OneSignal not configured', {
      hasApiKey: Boolean(apiKey),
      hasAppId: Boolean(appId),
    });
    return { success: false, error: 'OneSignal REST API key or App ID not configured' };
  }
  if (subscriptionIds.length === 0) {
    console.log('[Push] No subscription IDs for payload, skipping', {
      payload,
    });
    return { success: true };
  }

  const body: Record<string, unknown> = {
    app_id: appId,
    include_subscription_ids: subscriptionIds,
    contents: { en: payload.body },
    headings: { en: payload.title },
  };
  if (payload.url) body.url = payload.url;
  if (payload.icon) body.chrome_web_icon = payload.icon;

  try {
    console.log('[Push] Sending to OneSignal', {
      subscriptionCount: subscriptionIds.length,
      subscriptionIds,
      appId,
      payload,
    });

    const res = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const text = await res.text().catch(() => '');

    console.log('[Push] OneSignal raw response', {
      status: res.status,
      statusText: res.statusText,
      rawBody: text,
    });

    const data = (text ? JSON.parse(text) : {}) as {
      id?: string;
      errors?: { invalid_subscription_ids?: string[]; invalid_player_ids?: string[] };
    };

    if (!res.ok) {
      return {
        success: false,
        error: Array.isArray(data.errors) ? data.errors.join('; ') : res.statusText,
      };
    }

    const invalid = data.errors?.invalid_subscription_ids ?? data.errors?.invalid_player_ids ?? [];
    return {
      success: true,
      messageId: data.id ?? undefined,
      invalidSubscriptionIds: Array.isArray(invalid) ? invalid : undefined,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { success: false, error: message };
  }
}

/**
 * Send push to a single app user (all their subscribed devices).
 */
export async function sendPushToUser(
  userId: string,
  payload: OneSignalPushPayload
): Promise<OneSignalSendResult> {
  const ids = await getPlayerIdsForUser(userId);
  return sendPushToSubscriptions(ids, payload);
}

/**
 * Send push to multiple app users (each user's subscribed devices).
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: OneSignalPushPayload
): Promise<OneSignalSendResult> {
  const ids = await getPlayerIdsForUsers(userIds);
  return sendPushToSubscriptions(ids, payload);
}