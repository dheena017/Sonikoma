import React from "react";
import { Skeleton } from "./Skeleton";

export function ChapterScraperSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in select-none">
      {/* Hero Banner Skeleton */}
      <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/80 p-6 md:p-8 shadow-2xl flex flex-col lg:flex-row gap-8 items-start">
        <Skeleton className="w-48 h-64 md:w-56 shrink-0 rounded-2xl" />
        <div className="flex flex-col gap-4 flex-1 min-w-0 w-full">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-10 w-3/4 rounded-xl" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-5/6 rounded-lg" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-8 w-28 rounded-xl" />
            <Skeleton className="h-8 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Chapter Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-neutral-900/80 border border-neutral-800/60 p-3 space-y-2">
            <Skeleton className="w-full aspect-[3/4] rounded-xl" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-3 w-2/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChapterScraperSkeleton;
