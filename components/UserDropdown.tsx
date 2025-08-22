'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Lock
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
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

const menuItems = [
  { label: 'View Profile', href: '/dashboard/profile', icon: User, locked: false },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, key: 'notifications', locked: false },
  { label: 'Chapter & Role', href: '#', icon: Users, locked: true },
  { label: 'Account & Security', href: '#', icon: Shield, locked: true },
  { label: 'Documents & Uploads', href: '#', icon: FileText, locked: true },
  { label: 'Help & Support', href: '#', icon: HelpCircle, locked: true },
];

export function UserDropdown({ user, completionPercent, hasUnread, unreadCount = 0, onSignOut }: UserDropdownProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile } = useProfile(); // Get profile from context

  const handleSignOut = () => {
    onSignOut();
    setIsMobileMenuOpen(false);
  };

  const handleMenuItemClick = (item: any) => {
    if (item.locked) {
      // Don't navigate for locked items
      return;
    }
    
    if (item.href !== '#') {
      window.location.href = item.href;
    }
  };

  return (
    <>
      {/* Desktop Dropdown */}
      <div className="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 rounded-2xl hover:bg-gray-50 transition-colors">
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
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align="end" 
            className="w-64 p-2 z-[99999]"
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
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <DropdownMenuItem 
                    key={item.label} 
                    onClick={() => handleMenuItemClick(item)}
                    className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-md transition-colors relative ${
                      item.locked 
                        ? 'text-gray-400 cursor-not-allowed hover:bg-gray-50' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-navy-700 cursor-pointer'
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
                  </DropdownMenuItem>
                );
              })}
            </div>

            {/* Divider */}
            <div className="my-2 border-t border-gray-200" />

            {/* Sign Out */}
            <DropdownMenuItem 
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left rounded-md transition-colors"
            >
              <LogOut className="w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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

      {/* Mobile Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent 
          side="right" 
          className="w-80 z-[99999]"
        >
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-left">Account Menu</SheetTitle>
          </SheetHeader>

          <div className="py-4">
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
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className={`flex items-center space-x-3 px-3 py-3 text-sm rounded-md transition-colors relative ${
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
                  </div>
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
        </SheetContent>
      </Sheet>
    </>
  );
} 