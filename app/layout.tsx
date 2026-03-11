import "../styles/globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';
import { BrandingProvider } from '@/lib/contexts/BrandingContext';
import { ConnectionsProvider } from '@/lib/contexts/ConnectionsContext';
import AppQueryProvider from '@/lib/query/AppQueryProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Favicon metadata - use PNG files for better quality
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://www.trailblaize.net'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      // Prioritize PNG files - browsers will use these for better quality
      { url: '/android-chrome-192x192.png', type: 'image/png', sizes: '192x192' },
      { url: '/android-chrome-512x512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

// Viewport configuration for mobile keyboard support
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  interactiveWidget: 'resizes-content', // Critical for mobile keyboard handling
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en">
        <head>
          {/* Viewport meta tag is now handled by Next.js viewport export */}
          {/* Google Fonts - Instrument Serif */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
          {/* Force browser to use PNG favicon - better quality than ICO */}
          <link rel="icon" type="image/png" sizes="32x32" href="/icon-32x32.png" />
          <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />
          {/* OneSignal Web Push: dev app on localhost, prod app on trailblaize.net */}
          <script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" defer />
          <script
            dangerouslySetInnerHTML={{
              __html: `
                window.OneSignalDeferred = window.OneSignalDeferred || [];
                OneSignalDeferred.push(async function(OneSignal) {
                  var devId = "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID_DEV || ''}";
                  var prodId = "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ''}";
                  var o = typeof window !== 'undefined' ? window.location.origin : '';
                  var isLocal = o === 'http://localhost:3000' || o === 'http://127.0.0.1:3000';
                  var appId = isLocal ? devId : prodId;
                  if (appId) {
                    await OneSignal.init({
                      appId: appId,
                      promptOptions: {
                        slidedown: {
                          prompts: [{ type: "push", autoPrompt: false }]
                        }
                      }
                    });
                  }
                });
              `,
            }}
          />
        </head>
        <body 
          className="antialiased bg-white text-gray-900"
          suppressHydrationWarning={true}
        >
          <AppQueryProvider>
            <AuthProvider>
              <ProfileProvider>
                <BrandingProvider>
                  <ConnectionsProvider>
                    {children}
                  </ConnectionsProvider>
                </BrandingProvider>
              </ProfileProvider>
            </AuthProvider>
          </AppQueryProvider>
          <Analytics />
          <SpeedInsights />
          {/* Desktop Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            className="hidden sm:block"
            toastClassName="!bg-white !shadow-lg !border !border-gray-200 !rounded-lg !p-4 !min-h-[60px]"
          />
          {/* Mobile Toast Container */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
            className="block sm:hidden"
            toastClassName="!bg-white !shadow-lg !border !border-gray-200 !rounded-lg !p-4 !min-h-[60px]"
          />
        </body>
      </html>
  );
}