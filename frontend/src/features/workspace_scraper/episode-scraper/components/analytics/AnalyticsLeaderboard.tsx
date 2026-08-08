import React from "react";
import { Award, Flame, Frown, Clock } from "lucide-react";

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

export interface AnalyticsLeaderboardProps {
  top5ByRating: Episode[];
  bottom5ByRating: Episode[];
  top5ByLikes: Episode[];
  bottom5ByLikes: Episode[];
}

const LeaderboardRow: React.FC<{
  idx: number;
  label: string;
  value: React.ReactNode;
  highlight: string;
}> = ({ idx, label, value, highlight }) => (
  <div className="py-2.5 flex items-center justify-between gap-3 text-xs">
    <div className="flex items-center gap-3 min-w-0">
      <span className="w-5 font-bold text-neutral-500 text-center font-mono">#{idx + 1}</span>
      <p className="font-semibold text-neutral-300 truncate min-w-0">{label}</p>
    </div>
    <span className={`font-bold font-mono shrink-0 px-1.5 py-0.5 rounded border text-xs ${highlight}`}>
      {value}
    </span>
  </div>
);

export const AnalyticsLeaderboard: React.FC<AnalyticsLeaderboardProps> = ({
  top5ByRating,
  bottom5ByRating,
  top5ByLikes,
  bottom5ByLikes,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Rated */}
      {top5ByRating.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-400" /> Top 5 Rated Episodes
            </h3>
            <p className="text-xs text-neutral-500">Chapters with highest reader ratings</p>
          </div>
          <div className="divide-y divide-neutral-800/40">
            {top5ByRating.map((ep, idx) => (
              <LeaderboardRow
                key={ep.url}
                idx={idx}
                label={`${ep.number}: ${ep.title}`}
                value={`★ ${ep.rating?.toFixed(2)}`}
                highlight="text-yellow-400 bg-yellow-950/20 border-yellow-900/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Liked */}
      {top5ByLikes.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400" /> Top 5 Most Liked Episodes
            </h3>
            <p className="text-xs text-neutral-500">Chapters with highest reader likes</p>
          </div>
          <div className="divide-y divide-neutral-800/40">
            {top5ByLikes.slice(0, 5).map((ep, idx) => (
              <LeaderboardRow
                key={ep.url}
                idx={idx}
                label={`${ep.number}: ${ep.title}`}
                value={`👍 ${ep.likes}`}
                highlight="text-orange-400 bg-orange-950/20 border-orange-900/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Rated */}
      {bottom5ByRating.length > 0 && bottom5ByRating[0]?.rating !== undefined && (
        <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-1.5">
              <Frown className="w-4 h-4 text-rose-400" /> Lowest 3 Rated Episodes
            </h3>
            <p className="text-xs text-neutral-500">Chapters with lowest rating reception</p>
          </div>
          <div className="divide-y divide-neutral-800/40">
            {bottom5ByRating.slice(0, 3).map((ep, idx) => (
              <LeaderboardRow
                key={ep.url}
                idx={idx}
                label={`${ep.number}: ${ep.title}`}
                value={`★ ${ep.rating?.toFixed(2)}`}
                highlight="text-rose-400 bg-rose-950/20 border-rose-900/30"
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom Liked */}
      {bottom5ByLikes.length > 0 && (
        <div className="bg-neutral-900/40 border border-neutral-800/70 p-5 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-400" /> Lowest 3 Liked Episodes
            </h3>
            <p className="text-xs text-neutral-500">Chapters with lowest reader likes</p>
          </div>
          <div className="divide-y divide-neutral-800/40">
            {bottom5ByLikes.slice(0, 3).map((ep, idx) => (
              <LeaderboardRow
                key={ep.url}
                idx={idx}
                label={`${ep.number}: ${ep.title}`}
                value={`👍 ${ep.likes}`}
                highlight="text-indigo-400 bg-indigo-950/20 border-indigo-900/30"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
