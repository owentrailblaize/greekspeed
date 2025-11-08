import { Card, CardContent } from "@/components/ui/card";

export function AlumniCardSkeleton() {
  return (
    <Card className="bg-white border border-gray-200 rounded-lg overflow-hidden group h-[280px] sm:h-[400px] flex flex-col animate-pulse">
      <CardContent className="!p-0 flex flex-col h-full">
        {/* Header Banner Skeleton */}
        <div className="h-16 bg-gray-200" />

        <div className="px-4 pb-4 -mt-8 relative flex-1 flex flex-col">
          {/* Avatar Skeleton */}
          <div className="flex justify-center mb-3">
            <div className="w-16 h-16 rounded-full border-4 border-white bg-gray-200 shadow-sm" />
          </div>

          {/* Name and Activity Status Skeleton */}
          <div className="text-center mb-2 space-y-2">
            <div className="h-5 bg-gray-200 rounded w-24 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-16 mx-auto" />
          </div>

          {/* Company and Job Title Skeleton */}
          <div className="text-center mb-3 space-y-1">
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto" />
            <div className="h-3 bg-gray-200 rounded w-28 mx-auto" />
          </div>

          {/* Location and Chapter Skeleton */}
          <div className="flex items-center justify-center gap-2 mb-3 flex-wrap">
            <div className="h-3 bg-gray-200 rounded w-20" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>

          {/* Skills/Tags Skeleton */}
          <div className="flex items-center justify-center gap-1 mb-3 flex-wrap">
            <div className="h-5 bg-gray-200 rounded-full w-16" />
            <div className="h-5 bg-gray-200 rounded-full w-20" />
            <div className="h-5 bg-gray-200 rounded-full w-14" />
          </div>

          {/* Action Button Skeleton */}
          <div className="mt-auto h-10">
            <div className="h-8 bg-gray-200 rounded w-full" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AlumniCardSkeletonGrid({ count = 24 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <AlumniCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}

