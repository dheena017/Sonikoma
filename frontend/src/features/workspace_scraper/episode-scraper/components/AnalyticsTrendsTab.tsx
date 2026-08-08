import React from "react";
import { Compass, ShieldAlert, Star, ThumbsUp } from "lucide-react";

interface AnalyticsStats {
  ratingDataPoints: Array<{ label: string; value: number }>;
  likesDataPoints: Array<{ label: string; value: number }>;
  maxPossibleRating: number;
}

interface HoveredPoint {
  index: number;
  label: string;
  value: number;
  type: "rating" | "likes";
}

interface HoveredEpisode {
  number: string;
  title: string;
  index: number;
  date: string;
  rating?: number;
  likes?: string;
}

interface AnalyticsTrendsTabProps {
  stats: AnalyticsStats;
  hoveredPoint: HoveredPoint | null;
  setHoveredPoint: (point: HoveredPoint | null) => void;
  hoveredEpisode: HoveredEpisode | null;
  renderTrendPath: (
    points: Array<{ label: string; value: number }>,
    width: number,
    height: number,
    minVal: number,
    maxVal: number
  ) => string;
  renderTrendArea: (
    points: Array<{ label: string; value: number }>,
    width: number,
    height: number,
    minVal: number,
    maxVal: number
  ) => string;
}

const AnalyticsTrendsTab: React.FC<AnalyticsTrendsTabProps> = ({
  stats,
  hoveredPoint,
  setHoveredPoint,
  hoveredEpisode,
  renderTrendPath,
  renderTrendArea,
}) => (
  <div className="space-y-6 animate-in fade-in duration-200">
    <div className="bg-neutral-950 p-4 border border-neutral-800 rounded-2xl flex items-center justify-between min-h-[58px]">
      {hoveredEpisode ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shrink-0 font-bold text-xs">
              #{hoveredEpisode.index}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {hoveredEpisode.number}: {hoveredEpisode.title}
              </p>
              <p className="text-[10px] text-neutral-500 font-medium">Released {hoveredEpisode.date}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 font-mono text-xs">
            {hoveredEpisode.rating && (
              <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-md">
                <Star size={12} className="fill-yellow-400/20" />
                <span>{hoveredEpisode.rating.toFixed(2)}</span>
              </div>
            )}
            {hoveredEpisode.likes && (
              <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md">
                <ThumbsUp size={12} />
                <span>{hoveredEpisode.likes}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-neutral-500 text-xs font-medium w-full justify-center">
          <Compass className="w-4 h-4 animate-spin-slow text-neutral-600" />
          <span>Hover over any data point on the charts to inspect episode statistics.</span>
        </div>
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {stats.ratingDataPoints.length >= 2 ? (
        <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4 backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-neutral-200">Episode Rating Trend</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Chronological score distribution (Oldest to Newest)</p>
          </div>
          <div className="h-60 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
                const y = 200 - val * 200;
                const labelVal = val * stats.maxPossibleRating;
                return (
                  <g key={idx} className="opacity-10">
                    <line x1="0" y1={y} x2="500" y2={y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="-8" y={y + 4} fill="white" fontSize="9" textAnchor="end" className="font-mono">
                      {labelVal.toFixed(1)}
                    </text>
                  </g>
                );
              })}
              <path d={renderTrendArea(stats.ratingDataPoints, 500, 200, 0, stats.maxPossibleRating)} fill="url(#ratingGrad)" />
              <path d={renderTrendPath(stats.ratingDataPoints, 500, 200, 0, stats.maxPossibleRating)} fill="none" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />

              {stats.ratingDataPoints.map((pt, i) => {
                const xStep = 500 / (stats.ratingDataPoints.length - 1 || 1);
                const x = i * xStep;
                const y = 200 - (pt.value / stats.maxPossibleRating) * 200;
                const isHovered = hoveredPoint && hoveredPoint.index === i && hoveredPoint.type === "rating";

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : 3.5}
                      className={`${isHovered ? "fill-yellow-450 stroke-white" : "fill-yellow-400 stroke-neutral-900"} stroke-[1.5] transition-all duration-150`}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      className="fill-transparent cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ index: i, label: pt.label, value: pt.value, type: "rating" })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/30 border border-neutral-850 p-8 rounded-2xl flex flex-col items-center justify-center text-center h-72">
          <ShieldAlert className="w-8 h-8 text-neutral-600 mb-2" />
          <h4 className="text-xs font-bold text-neutral-400">Rating Graph Not Available</h4>
          <p className="text-[10px] text-neutral-600 max-w-xs mt-1">Need at least 2 rated chapters to graph trends.</p>
        </div>
      )}

      {stats.likesDataPoints.length >= 2 ? (
        <div className="bg-neutral-900/60 border border-neutral-800/80 p-5 rounded-2xl space-y-4 backdrop-blur-md">
          <div>
            <h3 className="text-sm font-bold text-neutral-250">Episode Engagement Trend</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Chronological likes volume (Oldest to Newest)</p>
          </div>
          <div className="h-60 w-full relative pt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
                const y = 200 - val * 200;
                const maxLikesFound = Math.max(...stats.likesDataPoints.map((d) => d.value)) || 1000;
                const labelVal = val * maxLikesFound;
                return (
                  <g key={idx} className="opacity-10">
                    <line x1="0" y1={y} x2="500" y2={y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="-8" y={y + 4} fill="white" fontSize="9" textAnchor="end" className="font-mono">
                      {labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal.toFixed(0)}
                    </text>
                  </g>
                );
              })}
              <path
                d={renderTrendArea(
                  stats.likesDataPoints,
                  500,
                  200,
                  0,
                  Math.max(...stats.likesDataPoints.map((d) => d.value)) || 1000
                )}
                fill="url(#likesGrad)"
              />
              <path
                d={renderTrendPath(
                  stats.likesDataPoints,
                  500,
                  200,
                  0,
                  Math.max(...stats.likesDataPoints.map((d) => d.value)) || 1000
                )}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {stats.likesDataPoints.map((pt, i) => {
                const xStep = 500 / (stats.likesDataPoints.length - 1 || 1);
                const x = i * xStep;
                const maxL = Math.max(...stats.likesDataPoints.map((d) => d.value)) || 1000;
                const y = 200 - (pt.value / maxL) * 200;
                const isHovered = hoveredPoint && hoveredPoint.index === i && hoveredPoint.type === "likes";

                return (
                  <g key={i}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : 3.5}
                      className={`${isHovered ? "fill-blue-500 stroke-white" : "fill-blue-400 stroke-neutral-900"} stroke-[1.5] transition-all duration-150`}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={14}
                      className="fill-transparent cursor-pointer"
                      onMouseEnter={() => setHoveredPoint({ index: i, label: pt.label, value: pt.value, type: "likes" })}
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        <div className="bg-neutral-900/30 border border-neutral-850 p-8 rounded-2xl flex flex-col items-center justify-center text-center h-72">
          <ShieldAlert className="w-8 h-8 text-neutral-600 mb-2" />
          <h4 className="text-xs font-bold text-neutral-400">Likes Graph Not Available</h4>
          <p className="text-[10px] text-neutral-600 max-w-xs mt-1">Need at least 2 chapters to graph trend reception.</p>
        </div>
      )}
    </div>
  </div>
);

export default AnalyticsTrendsTab;
