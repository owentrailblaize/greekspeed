import "../styles/globals.css";
import type { ReactNode } from "react";
import { Providers } from '@/components/providers/Providers';
import { Metadata } from 'next';
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';
import { ConnectionsProvider } from '@/lib/contexts/ConnectionsContext';
import AppQueryProvider from '@/lib/query/AppQueryProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const metadata: Metadata = {
  title: 'Trailblaize – Alumni Relationship Management',
  description: 'Trailblaize is the modern operating system for Greek organizations, powering alumni engagement, events, and chapter growth.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body 
          className="antialiased bg-white text-gray-900"
          suppressHydrationWarning={true}
        >
          <AppQueryProvider>
            <AuthProvider>
              <ProfileProvider>
                <Providers>
                  {children}
                </Providers>
              </ProfileProvider>
            </AuthProvider>
          </AppQueryProvider>
          <Analytics />
          <SpeedInsights />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            className="hidden sm:block"
          />
        </body>
      </html>
  );
}