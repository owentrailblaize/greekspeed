import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAppStatus } from '@/lib/config/ks';

export async function middleware(req: NextRequest) {
  // Check app status first
  try {
    const appStatus = await getAppStatus();
    
    if (appStatus.active) {
      // Allow webhook endpoints to continue
      if (req.nextUrl.pathname.startsWith('/api/webhooks/') || 
          req.nextUrl.pathname.startsWith('/api/telnyx/webhooks')) {
        return NextResponse.next();
      }
      
      // Allow monitoring routes
      if (req.nextUrl.pathname.startsWith('/monitoring')) {
        return NextResponse.next();
      }
      // Return maintenance page
      return new NextResponse(
        `<!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Can't open this page</title>
      <style>
      * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      }
      body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: #ffffff;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      }
      .error-container {
      text-align: center;
      max-width: 600px;
      width: 100%;
      }
      .error-icon {
      font-size: 120px;
      line-height: 1;
      margin-bottom: 2rem;
      filter: grayscale(100%);
      opacity: 0.6;
      }
      h1 {
      font-size: 1.75rem;
      font-weight: 400;
      color: #333;
      margin-bottom: 2rem;
      }
      .tips-section {
      text-align: left;
      margin: 2rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      }
      .tips-section h2 {
      font-size: 1rem;
      font-weight: 500;
      color: #333;
      margin-bottom: 1rem;
      }
      .tips-section ul {
      list-style: none;
      padding: 0;
      }
      .tips-section li {
      font-size: 0.9375rem;
      color: #666;
      margin-bottom: 0.75rem;
      padding-left: 1.5rem;
      position: relative;
      }
      .tips-section li:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #666;
      font-weight: bold;
      }
      .error-code {
      font-size: 0.875rem;
      color: #999;
      margin-top: 2rem;
      font-family: 'Courier New', monospace;
      }
      .footer-links {
      margin-top: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      }
      .learn-more {
      color: #1a73e8;
      text-decoration: none;
      }
      .learn-more:hover {
      text-decoration: underline;
      }
      .reload-button {
      background: #ff6b35;
      color: white;
      border: none;
      padding: 0.625rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      }
      .reload-button:hover {
      background: #e55a2b;
      }
      </style>
      </head>
      <body>
      <div class="error-container">
      <div class="error-icon">📁</div>
      <h1>Can't open this page</h1>
      <div class="tips-section">
      <h2>Try the following tips:</h2>
      <ul>
        <li>Open page in a new Private window (Ctrl-Shift-N)</li>
        <li>Restart your browser</li>
        <li>Restart your computer</li>
      </ul>
      </div>
      <div class="error-code">Error code: STATUS_INVALID_IMAGE_HASH</div>
      <div class="footer-links">
      <a href="#" class="learn-more" onclick="return false;">Learn more</a>
      <button class="reload-button" onclick="window.location.reload();">Reload</button>
      </div>
      </div>
      </body>
      </html>`,
        {
          status: 503,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }
  } catch (error) {
    // If status check fails, allow request through (fail open)
  }

  // Skip middleware for webhook endpoints
  if (req.nextUrl.pathname.startsWith('/api/webhooks/') || 
      req.nextUrl.pathname.startsWith('/api/telnyx/webhooks')) {
    return NextResponse.next();
  }

  const isActivityAPI = req.nextUrl.pathname === '/api/activity';
  
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

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};