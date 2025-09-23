import "../styles/globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';
import { ConnectionsProvider } from '@/lib/contexts/ConnectionsContext';
import { GlobalStateProvider } from '@/lib/contexts/GlobalStateContext';
import { AutoPersistenceProvider } from '@/lib/hooks/useAutoPersistentState';
import { StatePersistenceDebugger } from '@/components/StatePersistenceDebugger';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en">
        <body 
          className="antialiased bg-white text-gray-900"
          suppressHydrationWarning={true}
        >
          <GlobalStateProvider storage="sessionStorage" prefix="greekspeed">
            <AutoPersistenceProvider>
              <AuthProvider>
                <ProfileProvider>
                  <ConnectionsProvider>
                    {children}
                    {/* Debug component - remove in production */}
                    <StatePersistenceDebugger />
                  </ConnectionsProvider>
                </ProfileProvider>
              </AuthProvider>
            </AutoPersistenceProvider>
          </GlobalStateProvider>
        </body>
      </html>
  );
} 