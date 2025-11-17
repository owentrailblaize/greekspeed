'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UserDropdown } from '@/components/features/profile/UserDropdown';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { ProfileService } from '@/lib/services/profileService';
import { MessageCircle, Lock } from 'lucide-react';

// Small helper for consistent tab styling
function NavLink({ href, label, locked = false }: { href: string; label: string; locked?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  if (locked) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center h-9 rounded-md px-2 sm:px-4 text-sm font-medium transition-colors duration-200 opacity-60 cursor-not-allowed',
          'text-gray-400'
        )}
        title="Feature coming soon!"
      >
        {label}
        <Lock className="h-3 w-3 ml-1 text-gray-400" />
      </div>
    );
  }
  
  return (
    <Link
      href={href}
      className={cn(
        'relative flex items-center justify-center h-9 rounded-md px-2 sm:px-4 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 ring-offset-2 ring-navy-500',
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

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { connections } = useConnections();
  const userRole = profile?.role;
  const pathname = usePathname();
  
  // Count pending connection requests that require action
  const pendingConnections = connections.filter(conn => 
    conn.status === 'pending' && conn.recipient_id === user?.id
  ).length;
  
  const completion = profile ? ProfileService.calculateCompletion(profile) : null;
  const completionPercent = completion?.percentage ?? 0;
  const hasUnread = pendingConnections > 0; // Now based on actual pending connections

  // Define navigation tabs with role-based access
  const navigationTabs = [
    { href: '/dashboard', label: 'Overview', roles: ['admin', 'active_member', 'alumni'], locked: false },
    { href: '/dashboard/alumni', label: 'Alumni', roles: ['admin', 'active_member', 'alumni'], locked: false },
    { href: '/dashboard/dues', label: 'Dues', roles: ['active_member', 'admin'], locked: false },
    { href: '/dashboard/admin', label: 'Exec Admin', roles: ['admin'], locked: false },
  ];

  // Filter tabs based on user role
  const visibleTabs = navigationTabs.filter(tab => 
    tab.roles.includes(userRole || '')
  );

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to landing page after successful sign out
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, redirect to landing page
      window.location.href = '/';
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur z-50">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left side - Logo/Branding (Mobile) and Navigation tabs (Desktop) */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Mobile Logo/Branding */}
          <Link 
            href="/dashboard" 
            className="sm:hidden flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <Image
              src="/logo.jpeg"
              alt="Trailblaize"
              width={24}
              height={24}
              className="rounded"
              priority
            />
            <span className="text-lg font-semibold text-slate-900">Trailblaize</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
            {visibleTabs.map((tab) => (
              <NavLink key={tab.href} href={tab.href} label={tab.label} locked={tab.locked} />
            ))}
          </div>
        </div>

        {/* Right side - Messages icon and User dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
          {/* Messages Icon Button */}
          <Link
            href="/dashboard/messages"
            className={cn(
              'relative flex items-center justify-center p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2',
              pathname === '/dashboard/messages' 
                ? 'bg-navy-50 text-navy-700' 
                : 'text-gray-600 hover:bg-gray-50 hover:text-navy-700'
            )}
          >
            <MessageCircle className="w-5 h-5" />
          </Link>

          <UserDropdown
            user={user}
            completionPercent={completionPercent}
            hasUnread={hasUnread}
            unreadCount={pendingConnections}
            onSignOut={handleSignOut}
          />
        </div>
      </div>

    </header>
  );
} 