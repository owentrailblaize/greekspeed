'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { UserGrowthFilters } from '@/types/user-growth';

interface UserGrowthFiltersProps {
  filters: UserGrowthFilters;
  onFiltersChange: (filters: UserGrowthFilters) => void;
}

export function UserGrowthFilters({ filters, onFiltersChange }: UserGrowthFiltersProps) {
  const [chapters, setChapters] = useState<Array<{ id: string; name: string }>>([]);
  const [localFilters, setLocalFilters] = useState<UserGrowthFilters>(filters);

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    try {
      const response = await fetch('/api/chapters');
      if (response.ok) {
        const data = await response.json();
        setChapters(data);
      }
    } catch (error) {
      console.error('Error loading chapters:', error);
    }
  };

  const handleFilterChange = (key: keyof UserGrowthFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value || undefined };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const cleared = {};
    setLocalFilters(cleared);
    onFiltersChange(cleared);
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Organization Filter */}
        <div>
          <Label htmlFor="chapter" className="text-xs">Organization</Label>
          <Select
            value={localFilters.chapterId || 'all'}
            onValueChange={(value) => handleFilterChange('chapterId', value === 'all' ? undefined : value)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All Organizations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Organizations</SelectItem>
              {chapters.map((chapter) => (
                <SelectItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range - Start */}
        <div>
          <Label htmlFor="startDate" className="text-xs">Start Date</Label>
          <input
            id="startDate"
            type="date"
            value={localFilters.startDate || ''}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Date Range - End */}
        <div>
          <Label htmlFor="endDate" className="text-xs">End Date</Label>
          <input
            id="endDate"
            type="date"
            value={localFilters.endDate || ''}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="w-full px-2 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Activity Window */}
        <div>
          <Label htmlFor="activityWindow" className="text-xs">Activity Window</Label>
          <Select
            value={localFilters.activityWindow?.toString() || '30'}
            onValueChange={(value) => handleFilterChange('activityWindow', parseInt(value) as 7 | 30 | 90)}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
