import React from "react";
import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md overflow-hidden shadow-xl">
      {/* Table Header Skeleton */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/80 bg-neutral-950/40 gap-4">
        {Array.from({ length: columns }).map((_, cIdx) => (
          <Skeleton key={cIdx} className="h-4 flex-1 rounded-md" />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      <div className="divide-y divide-neutral-800/40">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div
            key={rIdx}
            className="flex items-center justify-between p-4 gap-4 animate-fade-in"
          >
            {Array.from({ length: columns }).map((_, cIdx) => (
              <Skeleton
                key={cIdx}
                className={`h-4 flex-1 rounded-md ${
                  cIdx === 0 ? "h-5 w-8 max-w-[40px]" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TableSkeleton;
