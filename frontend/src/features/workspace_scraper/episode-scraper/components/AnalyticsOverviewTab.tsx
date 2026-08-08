import React from "react";
import {
  Activity,
  Star,
  ThumbsUp,
  TrendingUp,
  TrendingDown,
  Compass,
  Award,
  Frown,
  Info,
} from "lucide-react";

interface AnalyticsStats {
  totalEpisodes: number;
  averageRating: number;
  averageLikes: number;
  totalLikes: number;
  maxPossibleRating: number;
  stdDev: number;
  consistencyTier: string;
  consistencyColor: string;
  trendDirection: "up" | "down" | "stable";
  trendDiff: number;
  maxRatingEpisode: {
    number: string;
    title: string;
    rating?: number;
    likes?: string;
  } | null;
  minRatingEpisode: {
    number: string;
    title: string;
    rating?: number;
    likes?: string;
  } | null;
}

interface AnalyticsOverviewTabProps {
  stats: AnalyticsStats;
}

const AnalyticsOverviewTab: React.FC<AnalyticsOverviewTabProps> = ({ stats }) => (
  <div className="space-y-6 animate-in fade-in duration-200">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/15 text-purple-400 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Volume</span>
          <p className="text-lg font-extrabold text-white mt-0.5">{stats.totalEpisodes} Episodes</p>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
          <Star className="w-5 h-5 fill-yellow-400/20" />
        </div>
        <div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Avg Rating</span>
          <p className="text-lg font-extrabold text-white mt-0.5">
            {stats.averageRating > 0 ? `${stats.averageRating.toFixed(2)} / ${stats.maxPossibleRating.toFixed(1)}` : "N/A"}
          </p>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center">
          <ThumbsUp className="w-5 h-5 fill-blue-500/10" />
        </div>
        <div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Total Likes</span>
          <p className="text-lg font-extrabold text-white mt-0.5">
            {stats.totalLikes >= 1000000
              ? `${(stats.totalLikes / 1000000).toFixed(2)}M`
              : stats.totalLikes >= 1000
              ? `${(stats.totalLikes / 1000).toFixed(1)}K`
              : stats.totalLikes}
          </p>
        </div>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-md">
        <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest font-mono">Engagement Ratio</span>
          <p className="text-lg font-extrabold text-white mt-0.5">
            {stats.averageLikes >= 1000
              ? `${(stats.averageLikes / 1000).toFixed(1)}K / Ep`
              : `${stats.averageLikes.toFixed(0)} / Ep`}
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className={`p-5 border rounded-2xl backdrop-blur-md flex flex-col justify-between space-y-4 ${stats.consistencyColor}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-purple-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Consistency Metric</h4>
            <p className="text-base font-extrabold text-white mt-0.5">{stats.consistencyTier}</p>
          </div>
        </div>
        <p className="text-xs opacity-70 leading-relaxed">
          The rating variance measures rating fluctuation across all chapters. A lower score signifies stable reception, showing that standard quality is maintained. Rating Standard Deviation: <span className="font-mono font-bold">{stats.stdDev.toFixed(3)}</span>.
        </p>
      </div>

      <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl flex flex-col justify-between space-y-4 backdrop-blur-md text-neutral-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 text-purple-400">
            {stats.trendDirection === "up" ? <TrendingUp className="w-5 h-5 text-emerald-450" /> : stats.trendDirection === "down" ? <TrendingDown className="w-5 h-5 text-rose-400" /> : <Info className="w-5 h-5 text-neutral-500" />}
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Reception Trend</h4>
            <p className="text-base font-extrabold text-white mt-0.5">
              {stats.trendDirection === "up" ? "Trending Upward" : stats.trendDirection === "down" ? "Trending Downward" : "Stable Reception"}
            </p>
          </div>
        </div>
        <p className="text-xs opacity-70 leading-relaxed">
          Compares the rating averages of the oldest chapters to the newest.
          {stats.trendDirection === "up"
            ? ` Quality reception is rising! Newer episodes score average ${stats.trendDiff.toFixed(2)} points higher.`
            : stats.trendDirection === "down"
            ? ` Quality reception is declining. Newer episodes average ${Math.abs(stats.trendDiff).toFixed(2)} points lower.`
            : " Quality and reader reception are extremely steady."}
        </p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {stats.maxRatingEpisode && (
        <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl flex gap-4">
          <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 flex-shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest font-mono">★ Highest Rated</span>
            <p className="text-sm font-bold text-neutral-200 mt-1 truncate">
              {stats.maxRatingEpisode.number}: {stats.maxRatingEpisode.title}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Rating: <span className="text-yellow-450 font-bold">{stats.maxRatingEpisode.rating?.toFixed(2)}</span> | Likes: {stats.maxRatingEpisode.likes}
            </p>
          </div>
        </div>
      )}

      {stats.minRatingEpisode && stats.minRatingEpisode !== stats.maxRatingEpisode && (
        <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl flex gap-4">
          <div className="w-14 h-14 bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-450 border border-rose-500/20 flex-shrink-0">
            <Frown className="w-7 h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono">⚠️ Lowest Rated</span>
            <p className="text-sm font-bold text-neutral-200 mt-1 truncate">
              {stats.minRatingEpisode.number}: {stats.minRatingEpisode.title}
            </p>
            <p className="text-xs text-neutral-500 mt-0.5">
              Rating: <span className="text-rose-400 font-bold">{stats.minRatingEpisode.rating?.toFixed(2)}</span> | Likes: {stats.minRatingEpisode.likes}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);

export default AnalyticsOverviewTab;
