import React, { useMemo } from 'react';
import { Star, ThumbsUp, Calendar, TrendingUp, Award, Activity, ShieldAlert } from 'lucide-react';

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

interface AnalyticsDashboardProps {
  episodes: Episode[];
  seriesTitle: string;
}

const parseLikes = (likesStr?: string): number => {
  if (!likesStr) return 0;
  const clean = likesStr.replace(/,/g, '').trim().toUpperCase();
  const numPart = parseFloat(clean);
  if (isNaN(numPart)) return 0;
  if (clean.endsWith('K')) return numPart * 1000;
  if (clean.endsWith('M')) return numPart * 1000000;
  if (clean.endsWith('B')) return numPart * 1000000000;
  return numPart;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  episodes,
  seriesTitle,
}) => {
  const stats = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;

    let totalRating = 0;
    let ratingCount = 0;
    let totalLikes = 0;
    let maxRating = -1;
    let maxRatingEpisode: Episode | null = null;
    let maxLikes = -1;
    let maxLikesEpisode: Episode | null = null;

    const ratingDataPoints: { label: string; value: number }[] = [];
    const likesDataPoints: { label: string; value: number }[] = [];

    // Process from oldest to newest for chronological charts
    const chronEpisodes = [...episodes].reverse();

    chronEpisodes.forEach((ep) => {
      const likesVal = parseLikes(ep.likes);
      totalLikes += likesVal;

      if (ep.rating) {
        totalRating += ep.rating;
        ratingCount++;
        if (ep.rating > maxRating) {
          maxRating = ep.rating;
          maxRatingEpisode = ep;
        }
        ratingDataPoints.push({ label: ep.number, value: ep.rating });
      }

      if (likesVal > maxLikes) {
        maxLikes = likesVal;
        maxLikesEpisode = ep;
      }
      likesDataPoints.push({ label: ep.number, value: likesVal });
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    return {
      averageRating,
      totalLikes,
      maxRatingEpisode,
      maxLikesEpisode,
      ratingDataPoints,
      likesDataPoints,
      totalEpisodes: episodes.length,
    };
  }, [episodes]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-neutral-500" />
        <h3 className="text-sm font-bold text-neutral-200">No Analytics Available</h3>
        <p className="text-xs text-neutral-500 max-w-sm">Please scrape a WEBTOON series first to see metrics and performance charts.</p>
      </div>
    );
  }

  // Helper to build SVG path for trend chart
  const renderTrendPath = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    if (points.length < 2) return '';
    const xStep = width / (points.length - 1);
    const valueRange = maxVal - minVal || 1;

    return points
      .map((p, i) => {
        const x = i * xStep;
        const normVal = (p.value - minVal) / valueRange;
        const y = height - normVal * height;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const renderTrendArea = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    const linePath = renderTrendPath(points, width, height, minVal, maxVal);
    if (!linePath) return '';
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Volume */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
          <div className="w-12 h-12 bg-purple-600/10 border border-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Total Volume</span>
            <p className="text-xl font-bold text-white mt-0.5">{stats.totalEpisodes} Episodes</p>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
          <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 fill-yellow-400" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Avg Rating</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {stats.averageRating > 0 ? `${stats.averageRating.toFixed(2)} / 5.0` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
          <div className="w-12 h-12 bg-blue-600/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
            <ThumbsUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Total Likes</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {stats.totalLikes >= 1000000
                ? `${(stats.totalLikes / 1000000).toFixed(2)}M`
                : stats.totalLikes >= 1000
                ? `${(stats.totalLikes / 1000).toFixed(1)}K`
                : stats.totalLikes}
            </p>
          </div>
        </div>

        {/* Release Stability */}
        <div className="bg-neutral-900/60 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4 backdrop-blur-sm">
          <div className="w-12 h-12 bg-green-600/10 border border-green-500/20 text-green-400 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Performance Tier</span>
            <p className="text-xl font-bold text-white mt-0.5">
              {stats.averageRating >= 9.8 ? 'S-Class' : stats.averageRating >= 9.5 ? 'A-Class' : 'Standard'}
            </p>
          </div>
        </div>
      </div>

      {/* Highlights & Honors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.maxRatingEpisode && (
          <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 flex-shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-yellow-500 uppercase tracking-widest font-mono flex items-center gap-1">
                ★ Highest Rated Episode
              </span>
              <p className="text-sm font-bold text-neutral-200 mt-1 truncate">
                {stats.maxRatingEpisode.number}: {stats.maxRatingEpisode.title}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Rating: {stats.maxRatingEpisode.rating?.toFixed(2)} | Likes: {stats.maxRatingEpisode.likes}
              </p>
            </div>
          </div>
        )}

        {stats.maxLikesEpisode && (
          <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 flex-shrink-0">
              <ThumbsUp className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-blue-450 uppercase tracking-widest font-mono flex items-center gap-1">
                👍 Most Liked Episode
              </span>
              <p className="text-sm font-bold text-neutral-200 mt-1 truncate">
                {stats.maxLikesEpisode.number}: {stats.maxLikesEpisode.title}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Likes: {stats.maxLikesEpisode.likes} | Rating: {stats.maxLikesEpisode.rating?.toFixed(1)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SVG Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Trend Line Chart */}
        {stats.ratingDataPoints.length >= 2 && (
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
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
                {/* Horizontal Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
                  const y = 200 - val * 200;
                  const labelVal = 0 + val * 5.0; // Assume ratings range 0 - 5
                  return (
                    <g key={idx} className="opacity-10">
                      <line x1="0" y1={y} x2="500" y2={y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="-5" y={y + 4} fill="white" fontSize="9" textAnchor="end" className="font-mono">
                        {labelVal.toFixed(1)}
                      </text>
                    </g>
                  );
                })}
                {/* Line Path */}
                <path
                  d={renderTrendArea(stats.ratingDataPoints, 500, 200, 0, 5.0)}
                  fill="url(#ratingGrad)"
                />
                <path
                  d={renderTrendPath(stats.ratingDataPoints, 500, 200, 0, 5.0)}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Likes Trend Area Chart */}
        {stats.likesDataPoints.length >= 2 && (
          <div className="bg-neutral-900 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-neutral-200">Episode Engagement Trend</h3>
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
                {/* Horizontal Guide Lines */}
                {[0, 0.25, 0.5, 0.75, 1.0].map((val, idx) => {
                  const y = 200 - val * 200;
                  const maxLikesFound = Math.max(...stats.likesDataPoints.map(d => d.value)) || 1000;
                  const labelVal = val * maxLikesFound;
                  return (
                    <g key={idx} className="opacity-10">
                      <line x1="0" y1={y} x2="500" y2={y} stroke="white" strokeWidth="1" strokeDasharray="3 3" />
                      <text x="-5" y={y + 4} fill="white" fontSize="9" textAnchor="end" className="font-mono">
                        {labelVal >= 1000 ? `${(labelVal / 1000).toFixed(0)}k` : labelVal.toFixed(0)}
                      </text>
                    </g>
                  );
                })}
                {/* Area Path */}
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
                {/* Line Path */}
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
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
