'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

        {/* Activity Window */}
        <div>
          <Label htmlFor="activityWindow" className="text-xs">Time Period</Label>
          <Select
            value={localFilters.activityWindow?.toString() || '30'}
            onValueChange={(value) => {
              const windowValue = value === 'all' ? 'all' : parseInt(value) as 30 | 90 | 180;
              handleFilterChange('activityWindow', windowValue);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">3 Months</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
