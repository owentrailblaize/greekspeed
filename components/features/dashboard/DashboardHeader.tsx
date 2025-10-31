'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { UserDropdown } from '@/components/features/profile/UserDropdown';
import { useAuth } from '@/lib/supabase/auth-context';
import { useProfile } from '@/lib/hooks/useProfile';
import { useConnections } from '@/lib/contexts/ConnectionsContext';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Lock, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { logger } from "@/lib/utils/logger";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Count pending connection requests that require action
  const pendingConnections = connections.filter(conn => 
    conn.status === 'pending' && conn.recipient_id === user?.id
  ).length;
  
  // Hardcoded values for now - will be replaced with real data later
  const completionPercent = 72; // Mock profile completion percentage
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

  // For mobile menu, filter out Alumni tab for alumni users only
  const mobileVisibleTabs = visibleTabs.filter(tab => {
    if (tab.href === '/dashboard/alumni' && userRole === 'alumni') {
      return false; // Hide Alumni tab on mobile for alumni
    }
    return true; // Show all other tabs
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirect to landing page after successful sign out
      window.location.href = '/';
    } catch (error) {
      logger.error('Error signing out:', { context: [error] });
      // Even if there's an error, redirect to landing page
      window.location.href = '/';
    }
  };

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur z-50">
      <div className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Left side - Navigation tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
          {/* Desktop Navigation - All Roles (including Alumni tab for alumni) */}
          <div className="hidden sm:flex items-center space-x-1 sm:space-x-2">
            {visibleTabs.map((tab) => (
              <NavLink key={tab.href} href={tab.href} label={tab.label} locked={tab.locked} />
            ))}
          </div>

          {/* Mobile Navigation - Hamburger Menu (All Roles) */}
          <div className="sm:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="p-2 text-gray-700 hover:text-navy-700 hover:bg-gray-50 rounded-md transition-colors duration-200"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
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

      {/* Mobile Menu - Expanding Header (All Roles, but Alumni tab hidden for alumni) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-white border-t border-gray-200"
          >
            <div className="px-4 py-4 space-y-3">
              {mobileVisibleTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block w-full text-left px-3 py-2 text-sm font-medium transition-colors duration-200 rounded-md',
                    pathname === tab.href 
                      ? 'bg-navy-50 text-navy-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-navy-700'
                  )}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 