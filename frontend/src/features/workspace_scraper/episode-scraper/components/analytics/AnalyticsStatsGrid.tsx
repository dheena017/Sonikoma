import React from "react";
import { Activity, Star, ThumbsUp } from "lucide-react";

interface Episode {
  number: string;
  title: string;
  date: string;
  thumbnail: string;
  url: string;
  index: number;
  rating?: number;
  likes?: string;
}

export interface AnalyticsStatsGridProps {
  episodes: Episode[];
  averageRating: number;
  averageLikes: number;
  consistencyTier: string;
  consistencyColor: string;
  trendDirection: "up" | "down" | "stable";
  trendDiff: number;
}

export const AnalyticsStatsGrid: React.FC<AnalyticsStatsGridProps> = ({
  episodes,
  averageRating,
  averageLikes,
  consistencyTier,
  consistencyColor,
  trendDirection,
  trendDiff,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Episodes */}
      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">{episodes.length}</p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
            Total Episodes
          </p>
        </div>
      </div>

      {/* Average Rating */}
      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-yellow-600/10 border border-yellow-500/15 text-yellow-400 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">
            {averageRating > 0 ? averageRating.toFixed(2) : "—"}
          </p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
            Avg Rating
          </p>
        </div>
      </div>

      {/* Average Likes */}
      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center">
          <ThumbsUp className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-black text-white">
            {averageLikes > 1000
              ? `${(averageLikes / 1000).toFixed(1)}K`
              : Math.round(averageLikes).toLocaleString()}
          </p>
          <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mt-0.5">
            Avg Likes / Ep
          </p>
        </div>
      </div>

      {/* Consistency Tier */}
      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl backdrop-blur-md">
        <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">
          Consistency Tier
        </p>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${consistencyColor}`}
        >
          {consistencyTier}
        </span>
        {trendDirection !== "stable" && (
          <p className="text-[10px] text-neutral-500 mt-2">
            Trend:{" "}
            <span
              className={
                trendDirection === "up" ? "text-emerald-400" : "text-rose-400"
              }
            >
              {trendDirection === "up" ? "▲" : "▼"} {Math.abs(trendDiff).toFixed(2)} pts
            </span>
          </p>
        )}
      </div>
    </div>
  );
};
