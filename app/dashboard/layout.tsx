'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Small helper for consistent tab styling
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 ring-offset-2 ring-navy-500',
        isActive ? 'bg-navy-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-navy-700'
      )}
    >
      {label}
      {isActive && (
        <motion.div
          layoutId="nav-indicator"
          className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-white"
        />
      )}
    </Link>
  );
}

const links = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/alumni', label: 'Alumni' },
  { href: '/dashboard/dues', label: 'Dues' },
  { href: '/dashboard/admin', label: 'Exec Admin' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center space-x-2 overflow-x-auto">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href} label={l.label} />
          ))}
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
} 