'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Wrench, MessageCircle, User, CheckSquare, FileText, Activity, X } from 'lucide-react';

export type MobileTab = 'home' | 'tasks' | 'announcements' | 'calendar' | 'events';

interface MobileBottomNavigationProps {
  activeTab?: MobileTab;
  onTabChange?: (tab: MobileTab) => void;
}

export function MobileBottomNavigation({ activeTab, onTabChange }: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Determine active tab based on pathname
  const getActiveTab = (): 'home' | 'alumni' | 'tools' | 'messages' | 'profile' => {
    if (pathname === '/dashboard/alumni') return 'alumni';
    if (pathname === '/dashboard/messages') return 'messages';
    if (pathname === '/dashboard/profile') return 'profile';
    if (pathname === '/dashboard' && activeTab) {
      // If we're on dashboard and have an activeTab prop, we're on home
      return 'home';
    }
    return 'home';
  };

  const currentActiveTab = getActiveTab();

  // Close tools menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        isToolsMenuOpen &&
        toolsMenuRef.current &&
        toolsButtonRef.current &&
        !toolsMenuRef.current.contains(event.target as Node) &&
        !toolsButtonRef.current.contains(event.target as Node)
      ) {
        setIsToolsMenuOpen(false);
      }
    };

    if (isToolsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isToolsMenuOpen]);

  // Close tools menu on route change
  useEffect(() => {
    setIsToolsMenuOpen(false);
  }, [pathname]);

  const handleHomeClick = () => {
    if (pathname !== '/dashboard') {
      router.push('/dashboard');
    }
    if (onTabChange) {
      onTabChange('home');
    }
    setIsToolsMenuOpen(false);
  };

  const handleAlumniClick = () => {
    router.push('/dashboard/alumni');
    setIsToolsMenuOpen(false);
  };

  const handleToolsClick = () => {
    setIsToolsMenuOpen(!isToolsMenuOpen);
  };

  const handleToolsOptionClick = (option: 'tasks' | 'docs' | 'ops') => {
    setIsToolsMenuOpen(false);
    // Navigate to dashboard with query param to show the specific tool
    router.push(`/dashboard?tool=${option}`);
    // Also trigger tab change if handler exists
    if (onTabChange) {
      const tabMap: Record<string, MobileTab> = {
        tasks: 'tasks',
        docs: 'tasks', // Map docs to tasks for now, or create a new tab type
        ops: 'tasks', // Map ops to tasks for now
      };
      onTabChange(tabMap[option] || 'home');
    }
  };

  const handleMessagesClick = () => {
    router.push('/dashboard/messages');
    setIsToolsMenuOpen(false);
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
    setIsToolsMenuOpen(false);
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      onClick: handleHomeClick,
      isActive: currentActiveTab === 'home',
    },
    {
      id: 'alumni',
      label: 'Alumni',
      icon: Users,
      onClick: handleAlumniClick,
      isActive: currentActiveTab === 'alumni',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageCircle,
      onClick: handleMessagesClick,
      isActive: currentActiveTab === 'messages',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: handleProfileClick,
      isActive: currentActiveTab === 'profile',
    },
  ];

  const toolsOptions = [
    {
      id: 'tasks',
      label: 'Tasks',
      icon: CheckSquare,
      onClick: () => handleToolsOptionClick('tasks'),
    },
    {
      id: 'docs',
      label: 'Docs',
      icon: FileText,
      onClick: () => handleToolsOptionClick('docs'),
    },
    {
      id: 'ops',
      label: 'Ops',
      icon: Activity,
      onClick: () => handleToolsOptionClick('ops'),
    },
  ];

  return (
    <>
      {/* Detached Footer Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-none">
        <div className="mx-2 mb-2 pointer-events-auto">
          {/* Main Footer Container */}
          <div className="relative bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-2 py-3 h-16">
              {/* Left Section: Home */}
              <button
                onClick={handleHomeClick}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors ${
                  currentActiveTab === 'home' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Home className={`h-5 w-5 mb-0.5 ${currentActiveTab === 'home' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${currentActiveTab === 'home' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Home
                </span>
                {currentActiveTab === 'home' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>

              {/* Left Section: Alumni */}
              <button
                onClick={handleAlumniClick}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                  currentActiveTab === 'alumni' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <Users className={`h-5 w-5 mb-0.5 ${currentActiveTab === 'alumni' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${currentActiveTab === 'alumni' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Alumni
                </span>
                {currentActiveTab === 'alumni' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>

              {/* Center Section: Tools FAB */}
              <div className="relative flex-shrink-0 mx-1">
                <button
                  ref={toolsButtonRef}
                  onClick={handleToolsClick}
                  className={`relative h-14 w-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
                    isToolsMenuOpen
                      ? 'bg-blue-600 text-white scale-110'
                      : currentActiveTab === 'tools'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isToolsMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Wrench className="h-6 w-6" />
                  )}
                </button>

                {/* Tools Popup Menu */}
                <AnimatePresence>
                  {isToolsMenuOpen && (
                    <motion.div
                      ref={toolsMenuRef}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 bg-white rounded-2xl shadow-xl p-2 border border-gray-100"
                    >
                      {toolsOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={option.onClick}
                            className="flex flex-col items-center justify-center h-12 w-12 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 transition-colors group"
                            title={option.label}
                          >
                            <Icon className="h-5 w-5 mb-0.5 group-hover:text-blue-600" />
                            <span className="text-[10px] font-medium group-hover:text-blue-600">{option.label}</span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right Section: Messages */}
              <button
                onClick={handleMessagesClick}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                  currentActiveTab === 'messages' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <MessageCircle className={`h-5 w-5 mb-0.5 ${currentActiveTab === 'messages' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${currentActiveTab === 'messages' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Messages
                </span>
                {currentActiveTab === 'messages' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>

              {/* Right Section: Profile */}
              <button
                onClick={handleProfileClick}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                  currentActiveTab === 'profile' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <User className={`h-5 w-5 mb-0.5 ${currentActiveTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${currentActiveTab === 'profile' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Profile
                </span>
                {currentActiveTab === 'profile' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-blue-600 rounded-full"
                  />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay when tools menu is open */}
      <AnimatePresence>
        {isToolsMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsToolsMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
