import { Card, CardContent } from "@/components/ui/card";

export function ChapterCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden group h-full flex flex-col animate-pulse">
      <CardContent className="!p-0 flex flex-col h-full">
        {/* Header Banner Skeleton */}
        <div className="h-8 sm:h-16 bg-gray-200" />

        <div className="px-1 sm:px-4 pb-1 sm:pb-4 -mt-4 sm:-mt-8 relative flex-1 flex flex-col">
          {/* Avatar Skeleton */}
          <div className="flex justify-center mb-1 sm:mb-4">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 sm:border-4 border-white bg-gray-200 shadow-sm" />
          </div>

          {/* Name Skeleton */}
          <div className="text-center mb-1 sm:mb-3 space-y-1">
            <div className="h-3 sm:h-5 bg-gray-200 rounded w-24 mx-auto" />
          </div>

          {/* Year Badge Skeleton - Only show on desktop */}
          <div className="text-center mb-1 hidden sm:block">
            <div className="h-4 bg-gray-200 rounded-full w-12 mx-auto" />
          </div>

          {/* Position and Description Skeleton */}
          <div className="text-center mb-1 sm:mb-4 space-y-1">
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-20 mx-auto" />
            <div className="hidden sm:block space-y-1">
              <div className="h-3 bg-gray-200 rounded w-32 mx-auto" />
              <div className="h-3 bg-gray-200 rounded w-28 mx-auto" />
            </div>
          </div>

          {/* Mutual Connections Skeleton */}
          <div className="flex flex-col items-center justify-center space-y-1 sm:space-y-2 mb-2 sm:mb-6">
            <div className="flex -space-x-1 justify-center">
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-gray-200" />
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-gray-200" />
              <div className="w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 border-white bg-gray-200" />
            </div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-24" />
          </div>

          {/* Action Button Skeleton */}
          <div className="mt-auto pt-2">
            <div className="h-7 sm:h-10 bg-gray-200 rounded-full w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ChapterCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-start">
      {Array.from({ length: count }).map((_, index) => (
        <ChapterCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
