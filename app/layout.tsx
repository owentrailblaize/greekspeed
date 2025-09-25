import "../styles/globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';
import { ConnectionsProvider } from '@/lib/contexts/ConnectionsContext';

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
          <AuthProvider>
            <ProfileProvider>
              <ConnectionsProvider>
                {children}
              </ConnectionsProvider>
            </ProfileProvider>
          </AuthProvider>
        </body>
      </html>
  );
} 