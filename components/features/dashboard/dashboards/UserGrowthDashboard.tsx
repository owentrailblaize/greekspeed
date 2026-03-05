'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/contexts/ProfileContext';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { UserGrowthKPICard } from './UserGrowthKPICard';
import { UserGrowthChart } from './UserGrowthChart';
import { UserGrowthFilters } from './UserGrowthFilters';
import { UserGrowthDrillDown } from './UserGrowthDrillDown';
import type { UserGrowthStats, UserGrowthFilters as Filters, MetricType } from '@/types/user-growth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export function UserGrowthDashboard() {
  const { isDeveloper } = useProfile();
  const { hasAccess, loading } = useRoleAccess(['admin']);
  const [stats, setStats] = useState<UserGrowthStats | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (isDeveloper || hasAccess)) {
      loadStats();
    }
  }, [loading, isDeveloper, hasAccess, filters]);

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const params = new URLSearchParams();
      if (filters.chapterId) params.append('chapter_id', filters.chapterId);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);
      if (filters.activityWindow) params.append('activity_window', filters.activityWindow.toString());

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isDeveloper && !hasAccess) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have access to this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Last Updated */}
      {stats && (
        <div className="mb-4 flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-2" />
          Last updated: {new Date(stats.lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Main Content: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Vertically Stacked KPI Cards */}
        <div className="lg:col-span-1 space-y-4">
          <UserGrowthKPICard
            title="Total Users"
            value={stats?.totalUsers || 0}
            loading={loadingStats}
            onClick={() => setSelectedMetric('total')}
          />
          <UserGrowthKPICard
            title="Alumni Users"
            value={stats?.alumniUsers || 0}
            loading={loadingStats}
            onClick={() => setSelectedMetric('alumni')}
          />
          <UserGrowthKPICard
            title="Member Users"
            value={stats?.activeMemberUsers || 0}
            loading={loadingStats}
            onClick={() => setSelectedMetric('active_member')}
          />
          <UserGrowthKPICard
            title="Admin Users"
            value={stats?.adminUsers || 0}
            loading={loadingStats}
            onClick={() => setSelectedMetric('admin')}
          />
        </div>

        {/* Right Column: Chart with Filters Inside */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Growth Trends</CardTitle>
              {/* Filters moved inside card header */}
              <div className="mt-4">
                <UserGrowthFilters filters={filters} onFiltersChange={setFilters} />
              </div>
            </CardHeader>
            <CardContent>
              <UserGrowthChart filters={filters} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drill Down Modal */}
      {selectedMetric && (
        <UserGrowthDrillDown
          metricType={selectedMetric}
          filters={filters}
          onClose={() => setSelectedMetric(null)}
        />
      )}
    </>
  );
}
