import { createClient } from '@supabase/supabase-js';

interface AppStatus {
  active: boolean;
  notice: string;
}

// Cache to avoid hitting database on every request
let cachedStatus: AppStatus | null = null;
let lastChecked = 0;
const CACHE_DURATION = 30000; // 30 seconds cache

export async function getAppStatus(): Promise<AppStatus> {
  const now = Date.now();
  
  // Return cached value if still valid
  if (cachedStatus && (now - lastChecked) < CACHE_DURATION) {
    return cachedStatus;
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return { active: false, notice: '' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    const { data, error } = await supabase
      .from('app_maintenance')
      .select('active, notice')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // Default to inactive if we can't fetch (fail open)
      cachedStatus = { active: false, notice: '' };
    } else {
      cachedStatus = {
        active: data?.active || false,
        notice: data?.notice || 'This application is currently unavailable.',
      };
    }
    
    lastChecked = now;
    return cachedStatus;
  } catch (error) {
    return { active: false, notice: '' };
  }
}

export function isMaintenanceMode(): Promise<boolean> {
  return getAppStatus().then(status => status.active);
}