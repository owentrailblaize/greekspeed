"use client";

import "../styles/globals.css";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trailblaize',
  description: 'Fraternity platform for alumni, dues, and executive administration.',
  openGraph: {
    images: ['/opengraph-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/twitter-image.png'],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="antialiased bg-white text-gray-900">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
} 