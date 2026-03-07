'use client';

import { useRef } from 'react';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { UserGrowthTable, type UserGrowthTableRef } from './UserGrowthTable';
import type { MetricType, UserGrowthFilters } from '@/types/user-growth';
import { X, Download } from 'lucide-react';

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
  const tableRef = useRef<UserGrowthTableRef>(null);

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
    <Drawer.Root
      open={true}
      onOpenChange={(open) => !open && onClose()}
      direction="bottom"
      modal={true}
      dismissible={true}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[9999] bg-black/40 transition-opacity" />
        <Drawer.Content
          className="
            bg-white flex flex-col z-[10000]
            fixed bottom-0 left-0 right-0
            max-w-6xl mx-auto
            h-[90dvh] min-h-[60dvh] max-h-[90dvh]
            rounded-t-[20px] shadow-2xl border border-gray-200
            outline-none p-0
          "
        >
          {/* Drag handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-2" />

          {/* Sticky header */}
          <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <Drawer.Title className="text-lg font-semibold text-gray-900">
                {getTitle()}
              </Drawer.Title>
              <div className="flex items-center gap-1">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => tableRef.current?.exportCsv()}
                  className="gap-2 rounded-full"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 flex-shrink-0 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Scrollable middle: only table body scrolls; pagination stays sticky at bottom */}
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-4 py-4">
            <UserGrowthTable
              ref={tableRef}
              metricType={metricType}
              filters={filters}
              variant="drawer"
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
