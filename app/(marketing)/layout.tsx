import Link from 'next/link';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { FooterNavigation, FooterSocialLinks } from '@/components/marketing/FooterNavigation';

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
  function scrollToSection(arg0: string): void {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-0">
          {/* Top Row: Logo, Navigation, Social */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 pb-0 border-b border-gray-200">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <Link href="/">
                <img 
                  src="/logo.png" 
                  alt="Trailblaize" 
                  className="h-24 w-auto object-contain transition-all duration-300 hover:opacity-90" 
                />
              </Link>
              
              {/* Navigation Links */}
              <FooterNavigation />
            </div>
            
            {/* Social Icons */}
            <FooterSocialLinks />
          </div>
          
          {/* Bottom Row: Legal & Support */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legal Column */}
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 font-sans">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900 font-sans transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/sms-terms" className="text-sm text-gray-600 hover:text-gray-900 font-sans transition-colors">
                    SMS Terms
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900 font-sans transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support Column */}
            <div className="text-center md:text-left">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 font-sans">Support</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900 font-sans transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <a 
                    href="mailto:support@trailblaize.net" 
                    className="text-sm text-gray-600 hover:text-gray-900 font-sans transition-colors"
                  >
                    support@trailblaize.net
                  </a>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 font-sans">
              © 2025 Trailblaize, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}