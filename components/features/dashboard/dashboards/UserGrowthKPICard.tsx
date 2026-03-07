'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, Users, GraduationCap, UserCheck, Shield } from 'lucide-react';

interface UserGrowthKPICardProps {
  title: string;
  value: number;
  amountChange?: number;
  subtitle?: string;
  icon?: 'users' | 'graduation' | 'user-check' | 'shield';
  loading?: boolean;
  onClick?: () => void;
}

const iconMap = {
  users: Users,
  graduation: GraduationCap,
  'user-check': UserCheck,
  shield: Shield,
};

export function UserGrowthKPICard({ 
  title, 
  value, 
  amountChange,
  subtitle,
  icon = 'users',
  loading, 
  onClick,
}: UserGrowthKPICardProps) {
  const IconComponent = iconMap[icon];
  
  // Determine trend color and icon based on amount change
  const getTrendDisplay = () => {
    if (amountChange === undefined || amountChange === null) return null;
    
    if (amountChange > 0) {
      return {
        color: 'text-green-600',
        icon: TrendingUp,
        sign: '+',
      };
    } else if (amountChange < 0) {
      return {
        color: 'text-red-600',
        icon: TrendingDown,
        sign: '',
      };
    } else {
      return {
        color: 'text-gray-600',
        icon: Minus,
        sign: '',
      };
    }
  };

  const trend = getTrendDisplay();

  return (
    <Card
      className={cn(
        'border border-gray-200 transition-all duration-200 hover:shadow-lg',
        onClick && 'cursor-pointer hover:border-gray-300'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-5 relative">
        {/* Icon in top-right */}
        {IconComponent && (
          <div className="absolute top-3 right-3 md:top-4 md:right-4 opacity-10">
            <IconComponent className="h-6 w-6 md:h-8 md:w-8 text-gray-400" />
          </div>
        )}

        <div className="space-y-2 md:space-y-3">
          {/* Title */}
          <div className="text-sm font-medium text-gray-600">{title}</div>
          
          {/* Value with Amount Change */}
          {loading ? (
            <div className="h-8 md:h-10 w-24 md:w-32 bg-gray-200 animate-pulse rounded" />
          ) : (
            <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap">
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {value.toLocaleString()}
              </div>
              {/* Amount Change with Arrow */}
              {trend && amountChange !== undefined && amountChange !== null && (
                <div className={cn('flex items-center gap-1 text-sm font-medium', trend.color)}>
                  <trend.icon className="h-4 w-4" />
                  <span>
                    {trend.sign}{Math.abs(amountChange).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <div className="text-xs text-gray-500">{subtitle}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
