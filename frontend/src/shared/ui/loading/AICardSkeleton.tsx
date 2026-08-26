import React from "react";
import { Skeleton } from "./Skeleton";

export function AICardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-5 space-y-4 shadow-xl backdrop-blur-md overflow-hidden animate-fade-in"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-xl bg-purple-950/40 border border-purple-500/20" />
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-3.5 w-12 rounded-full" />
                </div>
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>

          {/* Description line */}
          <Skeleton className="h-3.5 w-5/6 rounded-md" />

          {/* Input field placeholder */}
          <Skeleton className="h-10 w-full rounded-xl" />

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-xl" />
          </div>
        </div>
      ))}
    </>
  );
}

export default AICardSkeleton;
