import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser auth must use @supabase/ssr createBrowserClient so PKCE stores the code verifier in cookies.
 * /auth/callback uses createServerClient + those cookies for exchangeCodeForSession.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// Server-side client for API routes (service role)
export const createServerSupabaseClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};
