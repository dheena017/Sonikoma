import React from "react";
import { Skeleton } from "./Skeleton";

interface ProjectCardSkeletonProps {
  count?: number;
}

export function ProjectCardSkeleton({ count = 1 }: ProjectCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="group relative flex flex-col rounded-2xl border border-neutral-800/80 bg-neutral-900/60 p-3 space-y-3 backdrop-blur-md shadow-xl overflow-hidden animate-fade-in"
        >
          {/* Top Aspect Ratio Cover Media Skeleton */}
          <div className="relative aspect-[16/10] w-full rounded-xl bg-neutral-950/80 border border-neutral-800/60 overflow-hidden">
            <Skeleton className="w-full h-full" />
            {/* Top Left Badge */}
            <div className="absolute top-2.5 left-2.5">
              <Skeleton className="h-5 w-16 rounded-full bg-purple-950/70 border border-purple-500/20" />
            </div>
            {/* Top Right Status Badge */}
            <div className="absolute top-2.5 right-2.5">
              <Skeleton className="h-5 w-12 rounded-full bg-neutral-900/80 border border-neutral-700/50" />
            </div>
          </div>

          {/* Details Row */}
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-6 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-1/3 rounded-md" />
              <Skeleton className="h-3 w-1/4 rounded-md" />
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60 px-1">
            <Skeleton className="h-3 w-20 rounded-md" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ProjectCardSkeleton;
