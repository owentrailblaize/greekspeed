import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Skip logging for activity API calls to reduce spam
  const isActivityAPI = req.nextUrl.pathname === '/api/activity';
  
  // if (!isActivityAPI) {
  // Middleware: Processing request
  // }
  
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  // Skip detailed session logging for activity API calls
  // if (!isActivityAPI) {
  // Middleware: Session check
  // Middleware: Request allowed to proceed
  // }

  // Don't block dashboard access for now - just log the session state
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/api/:path*'],
};