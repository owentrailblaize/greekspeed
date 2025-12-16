'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Instagram, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Recruit, RecruitStage } from '@/types/recruitment';
import { cn } from '@/lib/utils';

const STAGE_COLORS: Record<RecruitStage, string> = {
  'New': 'bg-blue-50 text-blue-700 border-blue-200',
  'Contacted': 'bg-slate-100 text-slate-700 border-slate-300',
  'Event Invite': 'bg-navy-50 text-navy-700 border-navy-200',
  'Bid Given': 'bg-gray-100 text-gray-700 border-gray-300',
  'Accepted': 'bg-blue-100 text-blue-800 border-blue-300',
  'Declined': 'bg-red-100 text-red-800 border-red-200',
};

interface RecruitCardProps {
  recruit: Recruit;
  isActive: boolean;
  onTap: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  index: number;
  total: number;
}

export function RecruitCard({
  recruit,
  isActive,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  index,
  total,
}: RecruitCardProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentTouch = e.targetTouches[0].clientX;
    const distance = currentTouch - touchStart;
    setSwipeOffset(distance);
    setTouchEnd(currentTouch);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      onSwipeLeft();
    } else if (isRightSwipe) {
      onSwipeRight();
    }

    // Reset
    setTouchStart(null);
    setTouchEnd(null);
    setSwipeOffset(0);
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recruit.phone_number) {
      window.location.href = `tel:${recruit.phone_number.replace(/\D/g, '')}`;
    }
  };

  const handleInstagramClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recruit.instagram_handle) {
      const handle = recruit.instagram_handle.replace(/^@/, '');
      window.open(`https://instagram.com/${handle}`, '_blank');
    }
  };

  // Card position styling
  const getCardStyle = () => {
    if (!isActive) {
      // Adjacent cards - slightly visible on sides
      const isPrevious = index < total - 1;
      return {
        transform: `translateX(${isPrevious ? '-90%' : '90%'}) scale(0.9)`,
        opacity: 0.5,
        zIndex: 5,
      };
    }
    // Active card - centered
    return {
      transform: `translateX(${swipeOffset}px)`,
      opacity: 1,
      zIndex: 10,
    };
  };

  const cardStyle = getCardStyle();

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute inset-0 transition-all duration-300 ease-out",
        !isActive && "pointer-events-none"
      )}
      style={cardStyle}
    >
      <Card
        className={cn(
          "w-full h-full cursor-pointer bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col",
          isActive && "shadow-lg"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onTap}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          {/* Stage Badge - Top */}
          <div className="flex justify-center mb-4">
            <Badge className={cn(STAGE_COLORS[recruit.stage])}>
              {recruit.stage}
            </Badge>
          </div>

          {/* Name - Centered */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {recruit.name}
            </h3>
            <p className="text-sm text-gray-600">
              {recruit.hometown}
            </p>
          </div>

          {/* Contact Info - Icons above text, column layout */}
          <div className="flex flex-col items-center space-y-4 w-full mb-6">
            {recruit.phone_number && (
              <button
                onClick={handlePhoneClick}
                className="flex flex-col items-center space-y-1.5 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">{recruit.phone_number}</span>
              </button>
            )}
            {recruit.instagram_handle && (
              <button
                onClick={handleInstagramClick}
                className="flex flex-col items-center space-y-1.5 text-gray-700 hover:text-pink-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
                <span className="text-xs">@{recruit.instagram_handle}</span>
              </button>
            )}
          </div>

          {/* Card indicator - Bottom */}
          <div className="mt-auto pt-4">
            <span className="text-xs text-gray-500">
              {index + 1} of {total}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

