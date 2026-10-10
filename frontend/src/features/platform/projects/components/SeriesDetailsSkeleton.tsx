import React from "react";
import { Skeleton } from "@/shared/ui/loading";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

export function SeriesDetailsSkeleton() {
  return (
    <div className="w-full min-w-0 flex-1 flex flex-col items-center justify-start py-4 sm:py-6 lg:py-8 animate-fade-in relative z-10 text-left select-none">
      <div className="w-full max-w-7xl mx-auto rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-4 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
        {/* Hero Banner Skeleton */}
        <div className="relative rounded-2xl overflow-hidden border border-[#2F2F2F] bg-[#1E1E1E] p-6 md:p-8 shadow-md flex flex-col lg:flex-row gap-8 items-start">
          <Skeleton className="w-48 h-64 md:w-56 shrink-0 rounded-xl" />
          <div className="flex flex-col gap-4 flex-1 w-full">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-9 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-full rounded-lg" />
            <Skeleton className="h-4 w-2/3 rounded-lg" />
            <div className="flex gap-3 pt-3">
              <Skeleton className="h-9 w-28 rounded-xl" />
              <Skeleton className="h-9 w-28 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Chapters Grid Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-36 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <ProjectCardSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SeriesDetailsSkeleton;
