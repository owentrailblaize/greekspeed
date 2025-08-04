"use client";

import "../styles/globals.css";
import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";

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