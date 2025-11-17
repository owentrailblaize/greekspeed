'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Wrench, CreditCard, User, CheckSquare, FileText, Activity, X } from 'lucide-react'; // Replace MessageCircle with CreditCard

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
  const getActiveTab = (): 'home' | 'alumni' | 'tools' | 'dues' | 'profile' => { // Change 'messages' to 'dues'
    if (pathname === '/dashboard/alumni') return 'alumni';
    if (pathname === '/dashboard/dues') return 'dues'; // Change from messages to dues
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
          bottom: window.innerHeight - rect.bottom + 80 // Match the increased spacing
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
            // Increase the spacing to move buttons higher (e.g., 80px instead of 8px)
            const baseBottomPosition = window.innerHeight - rect.bottom + 80; // Increased from 8px
            
            setButtonPosition({
              left: centerX,
              bottom: baseBottomPosition
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

  // Replace handleMessagesClick with handleDuesClick
  const handleDuesClick = () => {
    router.push('/dashboard/dues');
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
      id: 'dues', // Change from 'messages' to 'dues'
      label: 'Dues', // Change label
      icon: CreditCard, // Change icon
      onClick: handleDuesClick, // Change handler
      isActive: currentActiveTab === 'dues', // Change active check
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

              {/* Right Section: Dues (replaces Messages) */}
              <button
                onClick={handleDuesClick}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                  currentActiveTab === 'dues' ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                <CreditCard className={`h-5 w-5 mb-0.5 ${currentActiveTab === 'dues' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className={`text-xs font-medium truncate ${currentActiveTab === 'dues' ? 'text-blue-600' : 'text-gray-500'}`}>
                  Dues
                </span>
                {currentActiveTab === 'dues' && (
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

      {/* Tools Popup Menu - Fixed positioning with pyramid effect */}
      <AnimatePresence>
        {isToolsMenuOpen && buttonPosition && (
          <div
            className="fixed z-50 sm:hidden"
            style={{
              left: `${buttonPosition.left}px`,
              bottom: `${buttonPosition.bottom}px`,
              transform: 'translateX(-50%)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex items-end gap-3">
              {/* Left Button (Tasks) - Lower position */}
              <motion.button
                key="tasks"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={() => handleToolsOptionClick('tasks')}
                className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 group shrink-0 relative"
                style={{ marginBottom: '0px' }}
                title="Tasks"
              >
                <CheckSquare className="h-5 w-5 mb-0.5 group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-medium group-hover:text-blue-600 whitespace-nowrap transition-colors">Tasks</span>
              </motion.button>

              {/* Center Button (Docs) - Higher position (pyramid peak) */}
              <motion.button
                key="docs"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                onClick={() => handleToolsOptionClick('docs')}
                className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 group shrink-0 relative"
                style={{ marginBottom: '12px' }} // Higher than others
                title="Docs"
              >
                <FileText className="h-5 w-5 mb-0.5 group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-medium group-hover:text-blue-600 whitespace-nowrap transition-colors">Docs</span>
              </motion.button>

              {/* Right Button (Ops) - Lower position */}
              <motion.button
                key="ops"
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                onClick={() => handleToolsOptionClick('ops')}
                className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 group shrink-0 relative"
                style={{ marginBottom: '0px' }}
                title="Ops"
              >
                <Activity className="h-5 w-5 mb-0.5 group-hover:text-blue-600 transition-colors" />
                <span className="text-[10px] font-medium group-hover:text-blue-600 whitespace-nowrap transition-colors">Ops</span>
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
