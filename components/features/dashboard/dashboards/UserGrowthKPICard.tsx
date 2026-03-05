'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface UserGrowthKPICardProps {
  title: string;
  value: number;
  loading?: boolean;
  onClick?: () => void;
}

export function UserGrowthKPICard({ title, value, loading, onClick }: UserGrowthKPICardProps) {
  return (
    <Card
      className={cn(
        'border border-gray-900 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-900">{title}</div>
          {loading ? (
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="text-4xl font-bold text-gray-900">{value.toLocaleString()}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
