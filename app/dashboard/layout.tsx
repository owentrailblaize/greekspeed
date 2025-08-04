'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/alumni', label: 'Alumni' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center space-x-6">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium text-gray-700 hover:text-navy-600',
                pathname === link.href && 'text-navy-600 underline'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
} 