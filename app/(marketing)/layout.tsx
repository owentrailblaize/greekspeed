import Link from 'next/link';
import { ReactNode } from 'react';
import type { Metadata } from 'next';
import { FooterNavigation, FooterSocialLinks } from '@/components/marketing/FooterNavigation';
import { APP_METADATA } from '@/lib/constants/metadata';

// Centralized metadata configuration; openGraph.url aligned with root metadataBase for consistent share previews.
export const metadata: Metadata = {
  title: APP_METADATA.title,
  description: APP_METADATA.description,
  openGraph: {
    title: APP_METADATA.title,
    description: APP_METADATA.description,
    url: APP_METADATA.baseUrl,
    siteName: APP_METADATA.siteName,
    images: [
      {
        url: APP_METADATA.ogImagePath,
        width: 1200,
        height: 630,
        alt: APP_METADATA.title,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_METADATA.title,
    description: APP_METADATA.description,
    images: [APP_METADATA.ogImagePath],
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