import Link from 'next/link';
import { ReactNode } from 'react';
import type { Metadata } from 'next';

// Centralized metadata configuration
export const metadata: Metadata = {
  title: 'Trailblaize –  Alumni Relationship Management',
  description:
    'Trailblaize is the modern operating system for Greek organizations, powering alumni engagement, events, and chapter growth.',
  openGraph: {
    title: 'Trailblaize – Alumni Relationship Management',
    description:
      'Trailblaize is the modern operating system for Greek organizations, powering alumni engagement, events, and chapter growth.',
    url: 'https://trailblaize.net',
    siteName: 'Trailblaize',
    images: [
      {
        url: '/og/Trailblaize.png',
        width: 1200,
        height: 630,
        alt: 'Trailblaize – Alumni Relationship Management',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Trailblaize – Alumni Relationship Management',
    description:
      'Trailblaize is the modern operating system for Greek organizations, powering alumni engagement, events, and chapter growth.',
    images: ['/og/Trailblaize.png'],
  },
};

interface MarketingLayoutProps {
  children: ReactNode;
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex flex-col items-center text-center md:items-start md:text-left md:flex-row md:gap-6">
                {/* Logo */}
                <div className="-mt-5 mb-1 md:mb-0 flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Trailblaize" 
                    className="h-32 w-auto object-contain transition-all duration-300 hover:opacity-90" 
                  />
                </div>
                
                {/* Text Content - Right side on desktop */}
                <div className="flex flex-col items-center md:items-start">
                  <p className="text-gray-600 text-sm mb-3 -mt-5 md:mt-0">
                    Empowering Greek organizations with modern technology solutions for alumni engagement, 
                    dues management, and chapter administration.
                  </p>
                  <div className="text-xs text-gray-500">
                    © 2025 Trailblaize, Inc. All rights reserved.
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-navy-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/sms-terms" className="text-sm text-gray-600 hover:text-navy-600">
                    SMS Terms
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-navy-600">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-navy-600">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a href="mailto:support@trailblaize.net" className="text-sm text-gray-600 hover:text-navy-600">
                    support@trailblaize.net
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}