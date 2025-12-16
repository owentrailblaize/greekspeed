'use client';

import { useState, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, MessageCircle, User, Edit } from 'lucide-react';
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

// Stage background colors for star badge
const STAGE_BG_COLORS: Record<RecruitStage, string> = {
  'New': 'bg-blue-500',
  'Contacted': 'bg-slate-500',
  'Event Invite': 'bg-navy-500',
  'Bid Given': 'bg-gray-500',
  'Accepted': 'bg-blue-600',
  'Declined': 'bg-red-500',
};

// Rotation degrees based on stage (for star icon)
const STAGE_ROTATIONS: Record<RecruitStage, number> = {
  'New': 0,
  'Contacted': 36,
  'Event Invite': 72,
  'Bid Given': 108,
  'Accepted': 144,
  'Declined': 180,
};

interface RecruitCardProps {
  recruit: Recruit;
  isActive: boolean;
  onTap: () => void;
  onEdit: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  index: number;
  total: number;
}

export function RecruitCard({
  recruit,
  isActive,
  onTap,
  onEdit,
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

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleMessageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (recruit.phone_number) {
      const phoneNumber = recruit.phone_number.replace(/\D/g, '');
      window.location.href = `sms:${phoneNumber}`;
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

  // Get stage-specific styling
  const stageBgColor = STAGE_BG_COLORS[recruit.stage];
  const stageRotation = STAGE_ROTATIONS[recruit.stage];

  return (
    <div
      ref={cardRef}
      className={cn(
        "absolute inset-0 transition-all duration-300 ease-out",
        !isActive && "pointer-events-none"
      )}
      style={cardStyle}
    >
      <div
        className={cn(
          "group relative overflow-hidden rounded-3xl bg-white p-6 w-full h-full shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-500 hover:shadow-[20px_20px_40px_rgba(0,0,0,0.2),-20px_-20px_40px_rgba(255,255,255,1)] hover:scale-[1:02] hover:-translate-y-2 flex flex-col cursor-pointer",
          !isActive && "opacity-50"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={onTap}
      >
        {/* Status indicator - Online (always show as active recruit) */}
        <div className="absolute right-4 top-4 z-10">
          <div className="relative">
            <div className="h-3 w-3 rounded-full border-2 border-white transition-all duration-300 group-hover:scale-125 bg-green-500 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.6)]"></div>
            <div className="absolute inset-0 h-3 w-3 rounded-full bg-green-500 animate-ping opacity-30"></div>
          </div>
        </div>

        {/* Star badge with stage-based rotation and color */}
        <div className="absolute right-4 top-10 z-10">
          <div className={cn(
            "rounded-full p-1 shadow-[2px_2px_4px_rgba(0,0,0,0.1)] transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.5)]",
            stageBgColor
          )}>
            <Star 
              className="h-3 w-3 fill-white text-white transition-transform duration-300" 
              style={{ transform: `rotate(${stageRotation}deg)` }}
            />
          </div>
        </div>

        {/* Profile Photo with placeholder */}
        <div className="mb-4 flex justify-center relative z-10">
          <div className="relative group-hover:animate-pulse">
            <div className="h-28 w-28 overflow-hidden rounded-full bg-white p-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all duration-500 group-hover:shadow-[inset_8px_8px_16px_rgba(0,0,0,0.15),inset_-8px_-8px_16px_rgba(255,255,255,1)] group-hover:scale-110">
              <div className="h-full w-full rounded-full bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
            </div>
            {/* Glowing ring on hover */}
            <div className="absolute inset-0 rounded-full border-2 border-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center relative z-10 transition-transform duration-300 group-hover:-translate-y-1 flex-1 flex flex-col justify-center">
          <h3 className="text-lg font-semibold text-gray-900 transition-colors duration-300 group-hover:text-blue-600 mb-1">
            {recruit.name}
          </h3>
          <p className="text-sm text-gray-500 transition-colors duration-300 group-hover:text-gray-700">
            {recruit.hometown}
          </p>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-2 relative z-10">
          <button
            onClick={handleEditClick}
            className="flex-1 rounded-full bg-white py-4 text-sm font-medium text-blue-600 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)] hover:scale-95 active:scale-90 group-hover:bg-blue-50"
          >
            <Edit className="mx-auto h-4 w-4 transition-transform duration-300 hover:scale-110" />
          </button>
          <button
            onClick={handleMessageClick}
            disabled={!recruit.phone_number}
            className={cn(
              "flex-1 rounded-full bg-white py-4 text-sm font-medium text-gray-700 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)] hover:scale-95 active:scale-90 group-hover:bg-gray-50",
              !recruit.phone_number && "opacity-50 cursor-not-allowed"
            )}
          >
            <MessageCircle className="mx-auto h-4 w-4 transition-transform duration-300 hover:scale-110" />
          </button>
        </div>

        {/* Animated border on hover */}
        <div className="absolute inset-0 rounded-3xl border border-blue-200 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>
    </div>
  );
}

