'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { UserDropdown } from './UserDropdown';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/hooks/useProfile';
import { useConnections } from '@/lib/hooks/useConnections';
import { Badge } from '@/components/ui/badge';

// Small helper for consistent tab styling
function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
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
  
  // Count pending connection requests that require action
  const pendingConnections = connections.filter(conn => 
    conn.status === 'pending' && conn.recipient_id === user?.id
  ).length;
  
  // Hardcoded values for now - will be replaced with real data later
  const completionPercent = 72; // Mock profile completion percentage
  const hasUnread = pendingConnections > 0; // Now based on actual pending connections

  // Define navigation tabs with role-based access
  const navigationTabs = [
    { href: '/dashboard', label: 'Overview', roles: ['admin', 'active_member', 'alumni'] },
    { href: '/dashboard/alumni', label: 'Alumni', roles: ['admin', 'alumni', 'active_member'] },
    { href: '/dashboard/dues', label: 'Dues', roles: ['active_member', 'alumni'] }, // Hidden from admin
    { href: '/dashboard/admin', label: 'Exec Admin', roles: ['admin'] }, // Hidden from non-admin
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
        {/* Left side - Navigation tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {visibleTabs.map((tab) => (
            <NavLink key={tab.href} href={tab.href} label={tab.label} />
          ))}
        </div>

        {/* Right side - User dropdown */}
        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
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