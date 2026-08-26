import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "rounded" | "circular" | "rectangular";
  shimmer?: boolean;
}

export function Skeleton({
  className = "",
  variant = "rounded",
  shimmer = true,
  ...props
}: SkeletonProps) {
  const variantStyles = {
    rounded: "rounded-xl",
    circular: "rounded-full",
    rectangular: "rounded-none",
  }[variant];

  return (
    <div
      className={`bg-neutral-800/80 border border-white/5 ${variantStyles} ${
        shimmer ? "skeleton-shimmer" : "animate-pulse"
      } ${className}`}
      {...props}
    />
  );
}

export default Skeleton;
