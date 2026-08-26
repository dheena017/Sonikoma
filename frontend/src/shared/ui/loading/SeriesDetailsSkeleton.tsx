import React from "react";
import { Skeleton } from "./Skeleton";
import { ProjectCardSkeleton } from "./ProjectCardSkeleton";

export function SeriesDetailsSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in select-none">
      {/* Hero Banner Skeleton */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/80 p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row gap-8 items-start">
        <Skeleton className="w-48 h-64 md:w-56 shrink-0 rounded-2xl" />
        <div className="flex flex-col gap-4 flex-1 w-full">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-9 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
          <div className="flex gap-3 pt-3">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
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
  );
}

export default SeriesDetailsSkeleton;
