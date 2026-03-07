'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { UserGrowthKPICard } from './UserGrowthKPICard';
import { UserGrowthChart } from './UserGrowthChart';
import { UserGrowthFilters } from './UserGrowthFilters';
import { UserGrowthDrillDown } from './UserGrowthDrillDown';
import type { UserGrowthStats, UserGrowthFilters as Filters, MetricType } from '@/types/user-growth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock, LayoutGrid, LineChart } from 'lucide-react';

export type CompactViewMode = 'cards' | 'graph';

export function UserGrowthDashboard() {
  const { isDeveloper } = useProfile();
  const { hasAccess, loading } = useRoleAccess(['admin']);
  const [stats, setStats] = useState<UserGrowthStats | null>(null);
  const [filters, setFilters] = useState<Filters>({ activityWindow: 30 });
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [compactViewMode, setCompactViewMode] = useState<CompactViewMode>('cards');

  // Use ref to track previous filters for comparison
  const prevFiltersRef = useRef<string>('');

  // Detect compact layout (below lg breakpoint) for card/graph toggle
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1023px)');
    const handleChange = (e: MediaQueryListEvent) => setIsCompactLayout(e.matches);
    setIsCompactLayout(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  // Memoize loadStats to prevent recreation on every render
  const loadStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const params = new URLSearchParams();
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.activityWindow) {
        params.append('activity_window', filters.activityWindow.toString());
      }

      const response = await fetch(`/api/developer/user-growth/stats?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load stats');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoadingStats(false);
    }
  }, [filters.chapterId, filters.activityWindow]);

  useEffect(() => {
    if (!loading && (isDeveloper || hasAccess)) {
      const filtersKey = JSON.stringify(filters);
      
      if (prevFiltersRef.current !== filtersKey) {
        prevFiltersRef.current = filtersKey;
        
        // Inline the fetch logic to avoid dependency on loadStats
        const fetchStats = async () => {
          try {
            setLoadingStats(true);
            const params = new URLSearchParams();
            if (filters.chapterId) params.append('chapter_id', filters.chapterId);
            if (filters.activityWindow) {
              params.append('activity_window', filters.activityWindow.toString());
            }
  
            const response = await fetch(`/api/developer/user-growth/stats?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to load stats');
            
            const data = await response.json();
            setStats(data);
          } catch (error) {
            console.error('Error loading stats:', error);
          } finally {
            setLoadingStats(false);
          }
        };
        
        fetchStats();
      }
    }
  }, [loading, isDeveloper, hasAccess, filters]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isDeveloper && !hasAccess) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have access to this dashboard.</p>
        </div>
      </div>
    );
  }

  // Helper function to calculate amount change over past week
  const calculateAmountChange = (current: number | undefined, previous: number | undefined): number | undefined => {
    if (current === undefined || previous === undefined) return undefined;
    return current - previous;
  };

  return (
    <div 
      className="h-full flex flex-col overflow-hidden"
      style={{
        height: '100%',
        maxHeight: '100%',
      }}
    >
      {/* Last Updated and compact view toggle */}
      <div className="mb-2 flex flex-shrink-0 items-center justify-between gap-2">
        {stats && (
          <div className="flex items-center text-xs text-gray-500 min-w-0">
            <Clock className="h-3 w-3 mr-1 flex-shrink-0 hidden sm:block" />
            <span className="truncate">
              <span className="sm:hidden">
                {new Date(stats.lastUpdated).toLocaleTimeString(undefined, {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
              <span className="hidden sm:inline">
                Last updated:{' '}
                {new Date(stats.lastUpdated).toLocaleString(undefined, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </span>
          </div>
        )}
        {isCompactLayout && (
          <Tabs
            value={compactViewMode}
            onValueChange={(v) => setCompactViewMode(v as CompactViewMode)}
            className="flex-shrink-0"
          >
            <TabsList className="h-9">
              <TabsTrigger value="cards" className="gap-1.5 text-xs">
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </TabsTrigger>
              <TabsTrigger value="graph" className="gap-1.5 text-xs">
                <LineChart className="h-3.5 w-3.5" />
                Graph
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Main Content: Toggle view on compact, two columns on lg+ */}
      {isCompactLayout ? (
        <Tabs
          value={compactViewMode}
          onValueChange={(v) => setCompactViewMode(v as CompactViewMode)}
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
        >
          <TabsContent
            value="cards"
            className="flex-1 min-h-0 mt-0 overflow-auto data-[state=inactive]:hidden"
          >
            <div className="grid grid-cols-2 grid-rows-2 gap-2 h-full min-h-0">
              <UserGrowthKPICard
                title="Total Users"
                value={stats?.totalUsers || 0}
                amountChange={calculateAmountChange(stats?.totalUsers, stats?.previousPeriod?.totalUsers)}
                icon="users"
                loading={loadingStats}
                onClick={() => setSelectedMetric('total')}
              />
              <UserGrowthKPICard
                title="Alumni Users"
                value={stats?.alumniUsers || 0}
                amountChange={calculateAmountChange(stats?.alumniUsers, stats?.previousPeriod?.alumniUsers)}
                subtitle="Active alumni memberships"
                icon="graduation"
                loading={loadingStats}
                onClick={() => setSelectedMetric('alumni')}
              />
              <UserGrowthKPICard
                title="Member Users"
                value={stats?.activeMemberUsers || 0}
                amountChange={calculateAmountChange(stats?.activeMemberUsers, stats?.previousPeriod?.activeMemberUsers)}
                subtitle="Seen in last 30 days"
                icon="user-check"
                loading={loadingStats}
                onClick={() => setSelectedMetric('active_member')}
              />
              <UserGrowthKPICard
                title="Admin Users"
                value={stats?.adminUsers || 0}
                amountChange={calculateAmountChange(stats?.adminUsers, stats?.previousPeriod?.adminUsers)}
                subtitle="Active exec roles"
                icon="shield"
                loading={loadingStats}
                onClick={() => setSelectedMetric('admin')}
              />
            </div>
          </TabsContent>
          <TabsContent
            value="graph"
            className="flex-1 min-h-0 mt-0 overflow-hidden data-[state=inactive]:hidden"
          >
            <Card className="flex flex-col h-full overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">User Growth Over Time</CardTitle>
                  <p className="text-sm text-gray-500">Monthly active users vs Total users trend</p>
                </div>
                <div className="mt-3">
                  <UserGrowthFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              </CardHeader>
              <CardContent
                className="flex-1 min-h-0 overflow-hidden p-4"
                style={{ contain: 'layout style paint', position: 'relative' }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    height: '100%',
                    minHeight: 0,
                    contain: 'layout style paint',
                    position: 'relative',
                  }}
                >
                  <UserGrowthChart filters={filters} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden"
          style={{ gridTemplateRows: '1fr' }}
        >
          <div className="lg:col-span-1 flex flex-col gap-2 overflow-hidden">
            <div className="flex-1 grid grid-cols-2 grid-rows-2 lg:grid-cols-1 lg:grid-rows-4 gap-2 min-h-0">
              <UserGrowthKPICard
                title="Total Users"
                value={stats?.totalUsers || 0}
                amountChange={calculateAmountChange(stats?.totalUsers, stats?.previousPeriod?.totalUsers)}
                icon="users"
                loading={loadingStats}
                onClick={() => setSelectedMetric('total')}
              />
              <UserGrowthKPICard
                title="Alumni Users"
                value={stats?.alumniUsers || 0}
                amountChange={calculateAmountChange(stats?.alumniUsers, stats?.previousPeriod?.alumniUsers)}
                subtitle="Active alumni memberships"
                icon="graduation"
                loading={loadingStats}
                onClick={() => setSelectedMetric('alumni')}
              />
              <UserGrowthKPICard
                title="Member Users"
                value={stats?.activeMemberUsers || 0}
                amountChange={calculateAmountChange(stats?.activeMemberUsers, stats?.previousPeriod?.activeMemberUsers)}
                subtitle="Seen in last 30 days"
                icon="user-check"
                loading={loadingStats}
                onClick={() => setSelectedMetric('active_member')}
              />
              <UserGrowthKPICard
                title="Admin Users"
                value={stats?.adminUsers || 0}
                amountChange={calculateAmountChange(stats?.adminUsers, stats?.previousPeriod?.adminUsers)}
                subtitle="Active exec roles"
                icon="shield"
                loading={loadingStats}
                onClick={() => setSelectedMetric('admin')}
              />
            </div>
          </div>
          <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
            <Card className="flex flex-col h-full overflow-hidden">
              <CardHeader className="flex-shrink-0 pb-3 border-b">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-semibold">User Growth Over Time</CardTitle>
                  <p className="text-sm text-gray-500">Monthly active users vs Total users trend</p>
                </div>
                <div className="mt-3">
                  <UserGrowthFilters filters={filters} onFiltersChange={setFilters} />
                </div>
              </CardHeader>
              <CardContent
                className="flex-1 min-h-0 overflow-hidden p-4"
                style={{ contain: 'layout style paint', position: 'relative' }}
              >
                <div
                  className="h-full w-full"
                  style={{
                    height: '100%',
                    minHeight: 0,
                    contain: 'layout style paint',
                    position: 'relative',
                  }}
                >
                  <UserGrowthChart filters={filters} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Drill Down Modal */}
      {selectedMetric && (
        <UserGrowthDrillDown
          metricType={selectedMetric}
          filters={filters}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </div>
  );
}