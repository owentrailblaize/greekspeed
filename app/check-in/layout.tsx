import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Event check-in',
  description: 'Check in to your chapter event on Trailblaize.',
};

/**
 * Public layout for camera / shared check-in links — no dashboard header or bottom nav.
 */
export default function PublicCheckInLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex-shrink-0 border-b border-gray-100 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold text-gray-900 tracking-tight hover:text-gray-700"
        >
          Trailblaize
        </Link>
      </header>
      <main className="flex-1 flex flex-col items-center w-full max-w-lg mx-auto px-4 py-8 sm:py-10">
        {children}
      </main>
      <footer className="flex-shrink-0 border-t border-gray-100 py-6 px-4 text-center text-xs text-gray-500">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/terms" className="hover:text-gray-800 underline-offset-2 hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gray-800 underline-offset-2 hover:underline">
            Privacy
          </Link>
          <Link href="/sign-in" className="hover:text-gray-800 underline-offset-2 hover:underline">
            Sign in
          </Link>
          <Link href="/sign-up" className="hover:text-gray-800 underline-offset-2 hover:underline">
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
