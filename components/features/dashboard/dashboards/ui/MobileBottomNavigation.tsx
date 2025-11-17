'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Wrench, CreditCard, User, CheckSquare, FileText, Activity, X, Search, Building2, LucideIcon } from 'lucide-react';

export type MobileTab = 'home' | 'tasks' | 'announcements' | 'calendar' | 'events';

export interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
  route?: string; // Optional route for navigation
  onClick?: () => void; // Optional callback if not using routes
}

interface MobileBottomNavigationProps {
  activeTab?: MobileTab | string;
  onTabChange?: (tab: MobileTab | string) => void;
  // New props for dynamic configuration
  tabs?: NavigationTab[]; // Custom tabs configuration
  showToolsMenu?: boolean; // Whether to show tools FAB (default: true for active members)
  toolsOptions?: Array<{
    id: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
  }>;
}

export function MobileBottomNavigation({ 
  activeTab, 
  onTabChange,
  tabs: customTabs,
  showToolsMenu = true,
  toolsOptions: customToolsOptions
}: MobileBottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [buttonPosition, setButtonPosition] = useState<{ left: number; bottom: number } | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const toolsButtonRef = useRef<HTMLButtonElement>(null);

  // Default tabs for active members
  const defaultTabs: NavigationTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      route: '/dashboard',
    },
    {
      id: 'alumni',
      label: 'Alumni',
      icon: Users,
      route: '/dashboard/alumni',
    },
    {
      id: 'dues',
      label: 'Dues',
      icon: CreditCard,
      route: '/dashboard/dues',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      route: '/dashboard/profile',
    },
  ];

  // Alumni tabs configuration
  const alumniTabs: NavigationTab[] = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
    },
    {
      id: 'network',
      label: 'Network',
      icon: Users,
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Search,
    },
    {
      id: 'chapter',
      label: 'Members',
      icon: Building2,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  // Use custom tabs if provided, otherwise use default
  const tabs = customTabs || defaultTabs;

  // Determine active tab based on pathname or prop
  const getActiveTab = (): string => {
    if (activeTab) return activeTab;
    
    // Try to match by route
    const currentTab = tabs.find(tab => tab.route && pathname === tab.route);
    if (currentTab) return currentTab.id;
    
    // Fallback to first tab
    return tabs[0]?.id || 'home';
  };

  const currentActiveTab = getActiveTab();

  // Default tools options for active members
  const defaultToolsOptions = [
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

  const toolsOptions = customToolsOptions || defaultToolsOptions;

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
        setButtonPosition(null);
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
          bottom: window.innerHeight - rect.bottom + 80
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isToolsMenuOpen]);

  const handleTabClick = (tab: NavigationTab) => {
    if (tab.route) {
      router.push(tab.route);
    } else if (tab.onClick) {
      tab.onClick();
    }
    
    if (onTabChange) {
      onTabChange(tab.id);
    }
    setIsToolsMenuOpen(false);
  };

  const handleToolsClick = () => {
    if (!isToolsMenuOpen && toolsButtonRef.current) {
      setTimeout(() => {
        requestAnimationFrame(() => {
          if (toolsButtonRef.current) {
            const rect = toolsButtonRef.current.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const baseBottomPosition = window.innerHeight - rect.bottom + 80;
            
            setButtonPosition({
              left: centerX,
              bottom: baseBottomPosition
            });
          }
        });
      }, 200);
    } else {
      setButtonPosition(null);
    }
    setIsToolsMenuOpen(!isToolsMenuOpen);
  };

  const handleToolsOptionClick = (option: 'tasks' | 'docs' | 'ops') => {
    setIsToolsMenuOpen(false);
    setButtonPosition(null);
    router.push(`/dashboard?tool=${option}`);
    if (onTabChange) {
      const tabMap: Record<string, MobileTab> = {
        tasks: 'tasks',
        docs: 'tasks',
        ops: 'tasks',
      };
      onTabChange(tabMap[option] || 'home');
    }
  };

  // Calculate grid columns based on number of tabs and whether tools menu is shown
  const hasToolsMenu = showToolsMenu && tabs.length <= 4; // Only show tools if 4 or fewer tabs
  const totalItems = tabs.length + (hasToolsMenu ? 1 : 0);
  const gridCols = `grid-cols-${totalItems}`;

  return (
    <>
      {/* Detached Footer Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pointer-events-none">
        <div className="mx-2 mb-2 pointer-events-auto">
          <div className="relative bg-white/95 backdrop-blur-sm rounded-t-3xl shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-2 py-3 h-16">
              {/* Left Section: First 2 tabs */}
              <div className="flex items-center flex-1 min-w-0">
                {tabs.slice(0, 2).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentActiveTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 inset-x-0 mx-auto w-8 h-0.5 bg-blue-600 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Center Section: Tools FAB */}
              {hasToolsMenu && (
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
              )}

              {/* Right Section: Last 2 tabs */}
              <div className="flex items-center flex-1 min-w-0">
                {tabs.slice(2).map((tab) => {
                  const Icon = tab.icon;
                  const isActive = currentActiveTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab)}
                      className={`flex flex-col items-center justify-center flex-1 min-w-0 transition-colors relative ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}
                    >
                      <Icon className={`h-5 w-5 mb-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      <span className={`text-xs font-medium truncate ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                        {tab.label}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTabIndicator"
                          className="absolute bottom-0 inset-x-0 mx-auto w-8 h-0.5 bg-blue-600 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tools Popup Menu - Keep existing code */}
      {hasToolsMenu && (
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
                {toolsOptions.map((option, index) => {
                  const Icon = option.icon;
                  const isCenter = index === Math.floor(toolsOptions.length / 2);
                  
                  return (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      onClick={option.onClick}
                      className="flex flex-col items-center justify-center h-14 w-14 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 transition-all duration-200 group shrink-0 relative"
                      style={{ marginBottom: isCenter ? '12px' : '0px' }}
                      title={option.label}
                    >
                      <Icon className="h-5 w-5 mb-0.5 group-hover:text-blue-600 transition-colors" />
                      <span className="text-[10px] font-medium group-hover:text-blue-600 whitespace-nowrap transition-colors">
                        {option.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
