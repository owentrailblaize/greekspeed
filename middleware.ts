import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('🔍 Middleware: Processing request for:', req.nextUrl.pathname);
  
  const res = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
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
    pathname: req.nextUrl.pathname 
  });

  // Temporarily disable dashboard protection to debug
  // if (req.nextUrl.pathname.startsWith('/dashboard')) {
  //   if (!session) {
  //     console.log('❌ Middleware: No session for dashboard, redirecting to sign-in');
  //     return NextResponse.redirect(new URL('/sign-in', req.url));
  //   }
  //   console.log('✅ Middleware: Session valid for dashboard access');
  // }

  // If user is signed in and tries to access auth pages, redirect to dashboard
  if (session && (req.nextUrl.pathname === '/sign-in' || req.nextUrl.pathname === '/sign-up')) {
    console.log('✅ Middleware: Signed in user accessing auth page, redirecting to dashboard');
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  console.log('✅ Middleware: Request allowed to proceed');
  return res;
}

export const config = {
  matcher: ['/dashboard/:path*', '/sign-in', '/sign-up'],
};