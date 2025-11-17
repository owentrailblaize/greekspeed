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
  const [buttonPosition, setButtonPosition] = useState<{ left: number; bottom: number } | null>(null);
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
        setButtonPosition(null); // Clear position when closing
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
    setButtonPosition(null);
  }, [pathname]);

  // Recalculate button position on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isToolsMenuOpen && toolsButtonRef.current) {
        const rect = toolsButtonRef.current.getBoundingClientRect();
        setButtonPosition({
          left: rect.left + rect.width / 2,
          bottom: window.innerHeight - rect.top + 8
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isToolsMenuOpen]);

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
    if (!isToolsMenuOpen && toolsButtonRef.current) {
      // Wait for the scale animation to complete (200ms) + one frame
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (toolsButtonRef.current) {
            const rect = toolsButtonRef.current.getBoundingClientRect();
            
            // The button's center X position (getBoundingClientRect accounts for scale)
            const centerX = rect.left + rect.width / 2;
            
            // Calculate bottom position from bottom of viewport
            // rect.bottom is the distance from top of viewport to bottom of button
            // So distance from bottom of viewport = window.innerHeight - rect.bottom
            const bottomPosition = window.innerHeight - rect.bottom + 8; // 8px spacing
            
            console.log('Button rect:', {
              left: rect.left,
              right: rect.right,
              width: rect.width,
              top: rect.top,
              bottom: rect.bottom,
              centerX,
              windowWidth: window.innerWidth,
              windowHeight: window.innerHeight,
              calculatedBottom: bottomPosition
            });
            
            setButtonPosition({
              left: centerX,
              bottom: bottomPosition
            });
          }
        });
      }, 200); // Wait for scale animation (duration-200 from className)
    } else {
      setButtonPosition(null);
    }
    setIsToolsMenuOpen(!isToolsMenuOpen);
  };

  const handleToolsOptionClick = (option: 'tasks' | 'docs' | 'ops') => {
    setIsToolsMenuOpen(false);
    setButtonPosition(null); // Clear position when option is selected
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

      {/* Tools Popup Menu - Fixed positioning based on button center */}
      <AnimatePresence>
        {isToolsMenuOpen && buttonPosition && (
          <motion.div
            ref={toolsMenuRef}
            initial={{ opacity: 0, y: 10, scale: 0.9, x:'-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
            transition={{ duration: 0.2 }}
            className="fixed flex gap-3 z-50 sm:hidden"
            style={{
              left: `${buttonPosition.left}px`,
              bottom: `${buttonPosition.bottom}px`,
              transform: 'translateY(50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {toolsOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={option.onClick}
                  className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 group shrink-0"
                  title={option.label}
                >
                  <Icon className="h-5 w-5 mb-0.5 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[10px] font-medium group-hover:text-blue-600 whitespace-nowrap transition-colors">{option.label}</span>
            </button>
          );
        })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
