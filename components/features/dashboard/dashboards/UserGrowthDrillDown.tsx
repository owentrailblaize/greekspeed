'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserGrowthTable } from './UserGrowthTable';
import type { MetricType, UserGrowthFilters } from '@/types/user-growth';
import { X } from 'lucide-react';

interface UserGrowthDrillDownProps {
  metricType: MetricType;
  filters: UserGrowthFilters;
  onClose: () => void;
}

export function UserGrowthDrillDown({
  metricType,
  filters,
  onClose,
}: UserGrowthDrillDownProps) {
  const getTitle = () => {
    switch (metricType) {
      case 'total':
        return 'Total Users';
      case 'admin':
        return 'Admin Users';
      case 'alumni':
        return 'Alumni Users';
      case 'active_member':
        return 'Member Users';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{getTitle()}</span>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>
        <UserGrowthTable metricType={metricType} filters={filters} />
      </DialogContent>
    </Dialog>
  );
}
