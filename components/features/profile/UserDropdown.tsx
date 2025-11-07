'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { 
  User, 
  Settings, 
  Shield, 
  FileText, 
  Bell, 
  Users, 
  HelpCircle, 
  LogOut,
  ChevronRight,
  ChevronDown,
  Lock,
  X,
  DollarSign
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { Badge } from '@/components/ui/badge';
import { useProfile } from '@/lib/contexts/ProfileContext';

// Update the interface to match UserAvatar expectations
interface UserDropdownProps {
  user: { 
    email?: string | null; 
    user_metadata?: { avatar_url?: string | null; full_name?: string };
    profile?: any; // Add profile data
  } | null;
  completionPercent: number;
  hasUnread: boolean;
  unreadCount?: number;
  onSignOut: () => void;
}

// Move menuItems inside the component where profile is available
export function UserDropdown({ user, completionPercent, hasUnread, unreadCount = 0, onSignOut }: UserDropdownProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopDropdownOpen, setIsDesktopDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { profile } = useProfile(); // Get profile from context

  useEffect(() => {
    setMounted(true);
  }, []);

  // Define menuItems here where profile is available
  const menuItems = [
    { label: 'View Profile', href: '/dashboard/profile', icon: User, locked: false },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, key: 'notifications', locked: false },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, locked: false },
  ];

  const visibleMenuItems = menuItems.filter(item => !item.locked);
  const handleSignOut = () => {
    onSignOut();
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
  };

  const handleMenuItemClick = (item: any) => {
    if (item.locked) {
      // Don't navigate for locked items
      return;
    }
    
    if (item.href !== '#') {
      window.location.href = item.href;
    }
    
    // Close menus after navigation
    setIsMobileMenuOpen(false);
    setIsDesktopDropdownOpen(false);
  };

  // Desktop Dropdown Component using Portal
  function DesktopDropdown({ 
    isOpen, 
    onClose, 
    user, 
    completionPercent, 
    hasUnread, 
    unreadCount, 
    onSignOut, 
    profile 
  }: {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    completionPercent: number;
    hasUnread: boolean;
    unreadCount: number;
    onSignOut: () => void;
    profile: any;
  }) {
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

    useEffect(() => {
      if (isOpen) {
        // Calculate position relative to the trigger button
        const triggerButton = document.querySelector('[data-user-dropdown-trigger]') as HTMLElement;
        if (triggerButton) {
          const rect = triggerButton.getBoundingClientRect();
          setDropdownPosition({
            top: rect.bottom + window.scrollY + 4, // 4px gap
            right: window.innerWidth - rect.right - window.scrollX
          });
        }
      }
    }, [isOpen]);

    const handleMenuItemClick = (item: any) => {
      if (item.locked) {
        return;
      }
      
      if (item.href !== '#') {
        window.location.href = item.href;
      }
      
      onClose();
    };

    const handleSignOut = () => {
      onSignOut();
      onClose();
    };

    // Prevent body scroll when dropdown is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const desktopDropdownContent = (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-transparent z-[99998]"
          onClick={onClose}
        />
        
        {/* Desktop Dropdown Content */}
        <div 
          className="fixed z-[99999] w-64 p-2 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          {/* Profile Completion Banner */}
          {completionPercent < 100 && (
            <div className="mb-3 p-3 bg-navy-50 rounded-lg border border-navy-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-navy-900">
                    Complete your profile ({completionPercent}%)
                  </p>
                  <p className="text-xs text-navy-600 mt-1">
                    Add missing information to unlock full features
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-navy-600" />
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.label} 
                  onClick={() => handleMenuItemClick(item)}
                  className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors relative cursor-pointer ${
                    item.locked 
                      ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-navy-700'
                  }`}
                >
                  <Icon className={`w-4 ${item.locked ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={item.locked ? 'line-through' : ''}>{item.label}</span>
                  
                  {/* Lock icon for locked items */}
                  {item.locked && (
                    <Lock className="w-3 h-3 ml-auto text-gray-400" />
                  )}
                  
                  {/* Tiny red bubble indicator over Notifications item */}
                  {item.key === 'notifications' && unreadCount > 0 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-2 border-t border-gray-200" />

          {/* Sign Out */}
          <div 
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-4" />
            <span>Sign out</span>
          </div>
        </div>
      </>
    );

    // Use portal to render at the top level
    return createPortal(desktopDropdownContent, document.body);
  }

  // Mobile Menu Component
  function MobileMenu({ 
    isOpen, 
    onClose, 
    user, 
    completionPercent, 
    hasUnread, 
    unreadCount, 
    onSignOut, 
    profile 
  }: {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    completionPercent: number;
    hasUnread: boolean;
    unreadCount: number;
    onSignOut: () => void;
    profile: any;
  }) {
    const handleMenuItemClick = (item: any) => {
      if (item.locked) {
        return;
      }
      
      if (item.href !== '#') {
        window.location.href = item.href;
      }
      
      onClose();
    };

    const handleSignOut = () => {
      onSignOut();
      onClose();
    };

    // Prevent body scroll when menu is open
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }

      return () => {
        document.body.style.overflow = 'unset';
      };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    const mobileMenuContent = (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/50 z-[99998] backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Mobile Menu Content */}
        <div className="fixed top-0 right-0 w-80 max-w-[85vw] bg-white shadow-xl z-[99999] rounded-l-xl border-l border-gray-200 max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-tl-xl sticky top-0">
            <h2 className="text-lg font-semibold text-gray-900">Account Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            {/* Profile Completion Banner */}
            {completionPercent < 100 && (
              <div className="mb-4 p-3 bg-navy-50 rounded-lg border border-navy-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-navy-900">
                      Complete your profile ({completionPercent}%)
                    </p>
                    <p className="text-xs text-navy-600 mt-1">
                      Add missing information to unlock full features
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-navy-600" />
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-1">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={() => handleMenuItemClick(item)}
                    className={`flex items-center space-x-3 px-3 py-3 text-sm rounded-md transition-colors relative w-full text-left ${
                      item.locked 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-navy-700'
                    }`}
                  >
                    <Icon className={`w-4 ${item.locked ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={item.locked ? 'line-through' : ''}>{item.label}</span>
                    
                    {/* Lock icon for locked items */}
                    {item.locked && (
                      <Lock className="w-3 h-3 ml-auto text-gray-400" />
                    )}
                    
                    {/* Tiny red bubble indicator over Notifications item */}
                    {item.key === 'notifications' && unreadCount > 0 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-gray-200" />

            {/* Sign Out */}
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-3 py-3 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-md transition-colors"
            >
              <LogOut className="w-4" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </>
    );

    // Use portal to render at the top level
    return createPortal(mobileMenuContent, document.body);
  }

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <button 
          className="flex items-center space-x-2 rounded-2xl hover:bg-gray-50 transition-colors p-2"
          onClick={() => setIsDesktopDropdownOpen(!isDesktopDropdownOpen)}
          data-user-dropdown-trigger
        >
          <UserAvatar
            user={{
              user_metadata: {
                avatar_url: profile?.avatar_url, // Use profile avatar_url
                full_name: profile?.full_name
              }
            }}
            completionPercent={completionPercent}
            hasUnread={hasUnread}
            unreadCount={unreadCount}
            size="md"
          />
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
        >
          <UserAvatar
            user={{
              user_metadata: {
                avatar_url: profile?.avatar_url, // Use profile avatar_url
                full_name: profile?.full_name
              }
            }}
            completionPercent={completionPercent}
            hasUnread={hasUnread}
            unreadCount={unreadCount}
            size="md"
          />
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Desktop Dropdown Portal */}
      <DesktopDropdown
        isOpen={isDesktopDropdownOpen}
        onClose={() => setIsDesktopDropdownOpen(false)}
        user={user}
        completionPercent={completionPercent}
        hasUnread={hasUnread}
        unreadCount={unreadCount}
        onSignOut={handleSignOut}
        profile={profile}
      />

      {/* Mobile Menu Portal */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        completionPercent={completionPercent}
        hasUnread={hasUnread}
        unreadCount={unreadCount}
        onSignOut={handleSignOut}
        profile={profile}
      />
    </>
  );
} 