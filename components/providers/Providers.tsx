'use client';

import type { ReactNode } from "react";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';
import { ConnectionsProvider } from '@/lib/contexts/ConnectionsContext';
import AppQueryProvider from '@/lib/query/AppQueryProvider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppQueryProvider>
      <AuthProvider>
        <ProfileProvider>
          <ConnectionsProvider>
            {children}
          </ConnectionsProvider>
        </ProfileProvider>
      </AuthProvider>
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
    </AppQueryProvider>
  );
}
