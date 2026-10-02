import React from "react";
import { Skeleton } from "@/shared/ui/loading/Skeleton";

interface ProjectsTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function ProjectsTableSkeleton({
  rows = 5,
  columns = 5,
}: ProjectsTableSkeletonProps) {
  return (
    <div className="w-full rounded-2xl border border-neutral-800/80 bg-neutral-900/60 backdrop-blur-md overflow-hidden shadow-xl">
      <div className="flex items-center justify-between p-4 border-b border-neutral-800/80 bg-neutral-950/40 gap-4">
        {Array.from({ length: columns }).map((_, columnIndex) => (
          <Skeleton key={columnIndex} className="h-4 flex-1 rounded-md" />
        ))}
      </div>

      <div className="divide-y divide-neutral-800/40">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center justify-between p-4 gap-4 animate-fade-in"
          >
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <Skeleton
                key={columnIndex}
                className={`h-4 flex-1 rounded-md ${
                  columnIndex === 0 ? "h-5 w-8 max-w-[40px]" : ""
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProjectsTableSkeleton;