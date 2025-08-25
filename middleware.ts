import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('🔍 Middleware: Processing request for:', req.nextUrl.pathname);
  
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

  console.log('🔍 Middleware: Session check:', { 
    hasSession: !!session, 
    error: error?.message,
    pathname: req.nextUrl.pathname,
    userId: session?.user?.id
  });

  // Don't block dashboard access for now - just log the session state
  console.log('✅ Middleware: Request allowed to proceed');
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up', '/api/:path*'],
};