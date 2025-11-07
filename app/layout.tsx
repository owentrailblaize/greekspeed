import "../styles/globals.css";
import type { ReactNode } from "react";
import { ReduxProvider } from '@/lib/store/provider';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

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
          <ReduxProvider>
            {children}
          </ReduxProvider>
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
  );
} 