import { createClient } from '@supabase/supabase-js';

interface AppStatus {
  active: boolean;
  notice: string;
}

// Cache to avoid hitting database on every request
let cachedStatus: AppStatus | null = null;
let lastChecked = 0;
const CACHE_DURATION = 30_000; // 30s

export async function getAppStatus(): Promise<AppStatus> {
  const now = Date.now();

  if (cachedStatus && now - lastChecked < CACHE_DURATION) {
    return cachedStatus;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { active: false, notice: '' };
  }

  try {
    const url =
      `${supabaseUrl}/rest/v1/app_maintenance` +
      `?select=active,notice&order=created_at.desc&limit=1`;

    const res = await fetch(url, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
        Accept: 'application/json',
      },
      // helps avoid stale edge caches if any
      cache: 'no-store',
    });

    if (!res.ok) {
      cachedStatus = { active: false, notice: '' }; // fail open
      lastChecked = now;
      return cachedStatus;
    }

    const rows = (await res.json()) as Array<{ active?: boolean; notice?: string }>;
    const row = rows[0];

    cachedStatus = {
      active: Boolean(row?.active),
      notice: row?.notice || (row?.active ? 'This application is currently unavailable.' : ''),
    };

    lastChecked = now;
    return cachedStatus;
  } catch {
    return { active: false, notice: '' }; // fail open
  }
}

export function isMaintenanceMode(): Promise<boolean> {
  return getAppStatus().then((status) => status.active);
}