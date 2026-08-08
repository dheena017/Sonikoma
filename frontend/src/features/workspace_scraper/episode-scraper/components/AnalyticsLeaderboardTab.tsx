import React from "react";
import { Award, ThumbsUp, Calendar, Frown, Clock } from "lucide-react";

interface AnalyticsStats {
  top5ByRating: Array<{ url: string; number: string; title: string; date: string; rating?: number }>;
  top5ByLikes: Array<{ url: string; number: string; title: string; date: string; likes?: string }>;
  bottom5ByRating: Array<{ url: string; number: string; title: string; rating?: number }>;
  bottom5ByLikes: Array<{ url: string; number: string; title: string; likes?: string }>;
}

interface AnalyticsLeaderboardTabProps {
  stats: AnalyticsStats;
}

const AnalyticsLeaderboardTab: React.FC<AnalyticsLeaderboardTabProps> = ({ stats }) => (
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
    <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-md">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Award className="w-4 h-4 text-yellow-500" />
          Top 5 Rated Episodes
        </h3>
        <p className="text-xs text-neutral-500">Highest reader rated chapters</p>
      </div>

      <div className="divide-y divide-neutral-800/60">
        {stats.top5ByRating.map((ep, idx) => (
          <div key={ep.url} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 font-bold text-neutral-500 text-center font-mono">#{idx + 1}</span>
              <div className="min-w-0">
                <p className="font-extrabold text-neutral-205 truncate">{ep.number}: {ep.title}</p>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Calendar size={10} />
                  {ep.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-bold font-mono">
              <Award size={10} className="fill-yellow-400/25" />
              {ep.rating?.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="bg-neutral-900/50 border border-neutral-800/60 p-5 rounded-2xl space-y-4 backdrop-blur-md">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
          <ThumbsUp className="w-4 h-4 text-blue-400" />
          Top 5 Engagement Episodes
        </h3>
        <p className="text-xs text-neutral-500">Highest likes count chapters</p>
      </div>

      <div className="divide-y divide-neutral-800/60">
        {stats.top5ByLikes.map((ep, idx) => (
          <div key={ep.url} className="py-3 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-5 font-bold text-neutral-500 text-center font-mono">#{idx + 1}</span>
              <div className="min-w-0">
                <p className="font-extrabold text-neutral-205 truncate">{ep.number}: {ep.title}</p>
                <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Calendar size={10} />
                  {ep.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-bold font-mono">
              <ThumbsUp size={10} />
              {ep.likes}
            </div>
          </div>
        ))}
      </div>
    </div>

    {stats.bottom5ByRating.length > 0 && stats.bottom5ByRating[0]?.rating !== undefined && (
      <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4 text-neutral-400">
        <div>
          <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-1.5">
            <Frown className="w-4 h-4 text-rose-400" />
            Lowest 3 Rated Episodes
          </h3>
          <p className="text-xs text-neutral-500">Chapters with lowest rating reception</p>
        </div>

        <div className="divide-y divide-neutral-800/40">
          {stats.bottom5ByRating.slice(0, 3).map((ep, idx) => (
            <div key={ep.url} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 font-bold text-neutral-500 text-center font-mono">#{idx + 1}</span>
                <p className="font-semibold text-neutral-300 truncate min-w-0">{ep.number}: {ep.title}</p>
              </div>
              <span className="text-rose-400 font-bold font-mono shrink-0 bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded">
                ★ {ep.rating?.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}

    {stats.bottom5ByLikes.length > 0 && (
      <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4 text-neutral-400">
        <div>
          <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            Lowest 3 Liked Episodes
          </h3>
          <p className="text-xs text-neutral-500">Chapters with lowest reader likes</p>
        </div>

        <div className="divide-y divide-neutral-800/40">
          {stats.bottom5ByLikes.slice(0, 3).map((ep, idx) => (
            <div key={ep.url} className="py-2.5 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 font-bold text-neutral-500 text-center font-mono">#{idx + 1}</span>
                <p className="font-semibold text-neutral-300 truncate min-w-0">{ep.number}: {ep.title}</p>
              </div>
              <span className="text-indigo-400 font-bold font-mono shrink-0 bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 rounded">
                👍 {ep.likes}
              </span>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
);

export default AnalyticsLeaderboardTab;
