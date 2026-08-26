import React from "react";
import { Skeleton } from "./Skeleton";

export function DashboardStatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="relative flex items-center justify-between p-5 rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md shadow-lg overflow-hidden"
        >
          <div className="space-y-2.5 flex-1">
            <Skeleton className="h-3.5 w-24 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-lg" />
            <Skeleton className="h-3 w-28 rounded-md" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

export default DashboardStatsSkeleton;
