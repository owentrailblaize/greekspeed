import "../styles/globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from '@/lib/supabase/auth-context';
import { ProfileProvider } from '@/lib/contexts/ProfileContext';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en">
        <body 
          className="antialiased bg-white text-gray-900"
          suppressHydrationWarning={true}
        >
          <AuthProvider>
            <ProfileProvider>
              {children}
            </ProfileProvider>
          </AuthProvider>
        </body>
      </html>
  );
} 