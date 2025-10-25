import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
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

  // Public API routes that don't require authentication
  const publicApiRoutes = [
    '/api/contact',
    '/api/webhooks/stripe',
    '/api/auth/forgot-password',
    '/api/auth/reset-password',
    '/api/chapters',
    '/api/connections',
    '/api/activity',
    '/api/events',  // Uses service role key
  ];

  // Define public API routes with tokens (invitation/join flows)
  const publicTokenRoutes = [
    '/api/join/',
    '/api/invitations/accept/',
    '/api/invitations/validate/',
    '/api/alumni-join/',
    '/api/alumni-invitations/accept/',
  ];

  const isPublicApiRoute = publicApiRoutes.includes(req.nextUrl.pathname);
  const isPublicTokenRoute = publicTokenRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // Handle API routes only
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // Skip authentication for public routes
    if (isPublicApiRoute || isPublicTokenRoute) {
      return response;
    }

    // For protected API routes, check for Bearer token OR cookie auth
    const authHeader = req.headers.get('authorization');
    const hasBearerToken = authHeader && authHeader.startsWith('Bearer ');
    
    // Check for Supabase auth cookies
    const authTokenCookie = req.cookies.getAll().find(cookie => 
      cookie.name.includes('sb-') && cookie.name.includes('-auth-token')
    );
    
    // If no Bearer token AND no auth cookies, block the request
    if (!hasBearerToken && !authTokenCookie) {
      return NextResponse.json(
        { error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // If Bearer token is present, let the API route handle it
    // If only cookies are present, verify they're valid
    if (!hasBearerToken && authTokenCookie) {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          return NextResponse.json(
            { error: 'Unauthorized - Invalid session' },
            { status: 401 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Unauthorized - Authentication required' },
          { status: 401 }
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'], // Only protect API routes
};