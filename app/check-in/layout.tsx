import type { Metadata } from 'next';
import Image from 'next/image';
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
            <header className="flex flex-shrink-0 items-center justify-center border-b border-gray-100 px-4 py-2 sm:px-6 sm:py-2.5">
        <Link
          href="/"
          className="inline-flex items-center leading-none rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          <Image
            src="/logo.png"
            alt="Trailblaize"
            width={200}
            height={56}
            className="h-10 w-auto object-contain sm:h-12"
            priority
          />
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
