import React, { useState, useMemo } from 'react';
import {
  Star,
  ThumbsUp,
  Calendar,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  ShieldAlert,
  Flame,
  Frown,
  Compass,
  ArrowRight,
  Info,
  Clock,
} from 'lucide-react';

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

interface HoveredPoint {
  index: number;
  label: string;
  value: number;
  type: 'rating' | 'likes';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'leaderboard'>('overview');
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const stats = useMemo(() => {
    if (!episodes || episodes.length === 0) return null;

    let totalRating = 0;
    let ratingCount = 0;
    let totalLikes = 0;
    let maxRating = -1;
    let maxRatingEpisode: Episode | null = null;
    let minRating = 999;
    let minRatingEpisode: Episode | null = null;
    let maxLikes = -1;
    let maxLikesEpisode: Episode | null = null;
    let minLikes = Infinity;
    let minLikesEpisode: Episode | null = null;

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
        if (ep.rating < minRating) {
          minRating = ep.rating;
          minRatingEpisode = ep;
        }
        ratingDataPoints.push({ label: ep.number, value: ep.rating });
      }

      if (likesVal > maxLikes) {
        maxLikes = likesVal;
        maxLikesEpisode = ep;
      }
      if (likesVal < minLikes) {
        minLikes = likesVal;
        minLikesEpisode = ep;
      }
      likesDataPoints.push({ label: ep.number, value: likesVal });
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    const averageLikes = episodes.length > 0 ? totalLikes / episodes.length : 0;

    const maxPossibleRating = episodes.some(ep => ep.rating && ep.rating > 5.0) ? 10.0 : 5.0;
    const scaleFactor = maxPossibleRating / 5.0;

    // Quality Consistency (Standard Deviation of Ratings)
    let varianceSum = 0;
    episodes.forEach(ep => {
      if (ep.rating) {
        varianceSum += Math.pow(ep.rating - averageRating, 2);
      }
    });
    const stdDev = ratingCount > 1 ? Math.sqrt(varianceSum / (ratingCount - 1)) : 0;
    
    let consistencyTier = "Standard";
    let consistencyColor = "text-neutral-400 bg-neutral-900/40 border-neutral-800";
    if (ratingCount > 0) {
      if (stdDev <= 0.15 * scaleFactor) {
        consistencyTier = "Stable Masterpiece";
        consistencyColor = "text-emerald-450 bg-emerald-950/20 border-emerald-900/30";
      } else if (stdDev <= 0.35 * scaleFactor) {
        consistencyTier = "High Consistency";
        consistencyColor = "text-teal-400 bg-teal-950/20 border-teal-900/30";
      } else if (stdDev <= 0.6 * scaleFactor) {
        consistencyTier = "Moderate Variance";
        consistencyColor = "text-amber-400 bg-amber-950/20 border-amber-900/30";
      } else {
        consistencyTier = "Highly Polarizing";
        consistencyColor = "text-rose-400 bg-rose-950/20 border-rose-900/30";
      }
    }

    // Trend Direction (Recent 25% vs older 75%)
    let trendDirection: 'up' | 'down' | 'stable' = 'stable';
    let trendDiff = 0;
    if (ratingCount >= 4) {
      const splitIdx = Math.floor(chronEpisodes.length * 0.75);
      const firstPart = chronEpisodes.slice(0, splitIdx).filter(e => e.rating);
      const lastPart = chronEpisodes.slice(splitIdx).filter(e => e.rating);
      
      const avgFirst = firstPart.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (firstPart.length || 1);
      const avgLast = lastPart.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (lastPart.length || 1);
      
      trendDiff = avgLast - avgFirst;
      if (trendDiff > 0.05 * scaleFactor) trendDirection = 'up';
      else if (trendDiff < -0.05 * scaleFactor) trendDirection = 'down';
    }

    // Sort listings for leaderboard
    const sortedByRating = [...episodes]
      .filter((e) => e.rating !== undefined)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0));

    const sortedByLikes = [...episodes]
      .sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));

    return {
      averageRating,
      averageLikes,
      totalLikes,
      maxRatingEpisode,
      minRatingEpisode,
      maxLikesEpisode,
      minLikesEpisode,
      ratingDataPoints,
      likesDataPoints,
      totalEpisodes: episodes.length,
      stdDev,
      consistencyTier,
      consistencyColor,
      trendDirection,
      trendDiff,
      maxPossibleRating,
      top5ByRating: sortedByRating.slice(0, 5),
      bottom5ByRating: sortedByRating.slice(-5).reverse(),
      top5ByLikes: sortedByLikes.slice(0, 5),
      bottom5ByLikes: sortedByLikes.slice(-5).reverse(),
    };
  }, [episodes]);

  const hoveredEpisode = useMemo(() => {
    if (!hoveredPoint) return null;
    return episodes.find((ep) => ep.number === hoveredPoint.label) || null;
  }, [hoveredPoint, episodes]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-neutral-500" />
        <h3 className="text-sm font-bold text-neutral-200">No Analytics Available</h3>
        <p className="text-xs text-neutral-500 max-w-sm">Please scrape a WEBTOON series first to see metrics and performance charts.</p>
      </div>
    );
  }

  const renderTrendPath = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    if (points.length < 2) return '';
    const xStep = width / (points.length - 1 || 1);
    const valueRange = maxVal - minVal || 1;

    return points
      .map((p, i) => {
        const x = i * xStep;
        const normVal = (p.value - minVal) / valueRange;
        const y = height - normVal * height;
        return `${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .reduce((acc, coord, idx) => {
        return idx === 0 ? `M ${coord}` : `${acc} L ${coord}`;
      }, '');
  };

  const renderTrendArea = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    const linePath = renderTrendPath(points, width, height, minVal, maxVal);
    if (!linePath) return '';
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="space-y-6">
      {/* Header and Tab Control */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-1 border-b border-neutral-800/80">
        <div>
          <h2 className="text-base font-black text-white">{seriesTitle}</h2>
          <p className="text-xs text-neutral-500 font-medium">Performance Metrics & Engagement Trends</p>
        </div>
        
        {/* Modern Tab Pill Selector */}
        <div className="flex bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 w-fit select-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Trends Chart
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Leaderboard
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Stats Grid */}
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
                  {stats.averageRating > 0 ? `${stats.averageRating.toFixed(2)} / ${stats.maxPossibleRating.toFixed(1)}` : 'N/A'}
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

          {/* Deep Insight Cards */}
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
                  {stats.trendDirection === 'up' ? <TrendingUp className="w-5 h-5 text-emerald-450" /> : stats.trendDirection === 'down' ? <TrendingDown className="w-5 h-5 text-rose-400" /> : <Info className="w-5 h-5 text-neutral-500" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider opacity-60">Reception Trend</h4>
                  <p className="text-base font-extrabold text-white mt-0.5">
                    {stats.trendDirection === 'up' ? 'Trending Upward' : stats.trendDirection === 'down' ? 'Trending Downward' : 'Stable Reception'}
                  </p>
                </div>
              </div>
              <p className="text-xs opacity-70 leading-relaxed">
                Compares the rating averages of the oldest chapters to the newest.
                {stats.trendDirection === 'up' 
                  ? ` Quality reception is rising! Newer episodes score average ${stats.trendDiff.toFixed(2)} points higher.`
                  : stats.trendDirection === 'down'
                  ? ` Quality reception is declining. Newer episodes average ${Math.abs(stats.trendDiff).toFixed(2)} points lower.`
                  : ' Quality and reader reception are extremely steady.'}
              </p>
            </div>
          </div>

          {/* Highlights Spotlights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.maxRatingEpisode && (
              <div className="bg-neutral-900/40 border border-neutral-800/80 p-5 rounded-2xl flex gap-4">
                <div className="w-14 h-14 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 flex-shrink-0">
                  <Award className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-black text-yellow-500 uppercase tracking-widest font-mono">
                    ★ Highest Rated
                  </span>
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
                  <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest font-mono">
                    ⚠️ Lowest Rated
                  </span>
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
      )}

      {/* Trends Chart Tab */}
      {activeTab === 'trends' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Live Point Inspector Bar */}
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
            {/* Rating Trend Line Chart */}
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
                    
                    {/* Interactive dots & hover targets */}
                    {stats.ratingDataPoints.map((pt, i) => {
                      const xStep = 500 / (stats.ratingDataPoints.length - 1 || 1);
                      const x = i * xStep;
                      const y = 200 - (pt.value / stats.maxPossibleRating) * 200;
                      const isHovered = hoveredPoint && hoveredPoint.index === i && hoveredPoint.type === 'rating';
                      
                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 5.5 : 3.5}
                            className={`${isHovered ? 'fill-yellow-450 stroke-white' : 'fill-yellow-400 stroke-neutral-900'} stroke-[1.5] transition-all duration-150`}
                          />
                          {/* Large transparent hover trigger */}
                          <circle
                            cx={x}
                            cy={y}
                            r={14}
                            className="fill-transparent cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ index: i, label: pt.label, value: pt.value, type: 'rating' })}
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

            {/* Likes Trend Area Chart */}
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
                      const maxLikesFound = Math.max(...stats.likesDataPoints.map(d => d.value)) || 1000;
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

                    {/* Interactive dots & hover targets */}
                    {stats.likesDataPoints.map((pt, i) => {
                      const xStep = 500 / (stats.likesDataPoints.length - 1 || 1);
                      const x = i * xStep;
                      const maxL = Math.max(...stats.likesDataPoints.map((d) => d.value)) || 1000;
                      const y = 200 - (pt.value / maxL) * 200;
                      const isHovered = hoveredPoint && hoveredPoint.index === i && hoveredPoint.type === 'likes';

                      return (
                        <g key={i}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isHovered ? 5.5 : 3.5}
                            className={`${isHovered ? 'fill-blue-500 stroke-white' : 'fill-blue-400 stroke-neutral-900'} stroke-[1.5] transition-all duration-150`}
                          />
                          {/* Large transparent hover trigger */}
                          <circle
                            cx={x}
                            cy={y}
                            r={14}
                            className="fill-transparent cursor-pointer"
                            onMouseEnter={() => setHoveredPoint({ index: i, label: pt.label, value: pt.value, type: 'likes' })}
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
      )}

      {/* Leaderboard / Rankings Tab */}
      {activeTab === 'leaderboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-200">
          {/* Top Rated Leaderboard */}
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
                    <Star size={10} className="fill-yellow-400/25" />
                    {ep.rating?.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Liked Leaderboard */}
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

          {/* Underperforming Rated Spotlight */}
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

          {/* Underperforming Likes Spotlight */}
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
      )}
    </div>
  );
};
