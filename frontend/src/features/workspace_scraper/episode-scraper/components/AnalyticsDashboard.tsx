import React, { useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import AnalyticsHeaderTabs, { type AnalyticsTab } from "./AnalyticsHeaderTabs";
import AnalyticsLeaderboardTab from "./AnalyticsLeaderboardTab";
import AnalyticsOverviewTab from "./AnalyticsOverviewTab";
import AnalyticsTrendsTab from "./AnalyticsTrendsTab";

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
  type: "rating" | "likes";
}

const parseLikes = (likesStr?: string): number => {
  if (!likesStr) return 0;
  const clean = likesStr.replace(/,/g, "").trim().toUpperCase();
  const value = parseFloat(clean);
  if (Number.isNaN(value)) return 0;
  if (clean.endsWith("K")) return value * 1000;
  if (clean.endsWith("M")) return value * 1000000;
  if (clean.endsWith("B")) return value * 1000000000;
  return value;
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ episodes, seriesTitle }) => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
  const [hoveredPoint, setHoveredPoint] = useState<HoveredPoint | null>(null);

  const stats = useMemo(() => {
    if (!episodes.length) return null;
    const chronological = [...episodes].reverse();
    const ratings = chronological.filter((episode) => episode.rating);
    const ratingValues = ratings.map((episode) => episode.rating || 0);
    const likesDataPoints = chronological.map((episode) => ({ label: episode.number, value: parseLikes(episode.likes) }));
    const ratingDataPoints = ratings.map((episode) => ({ label: episode.number, value: episode.rating || 0 }));
    const totalLikes = likesDataPoints.reduce((sum, point) => sum + point.value, 0);
    const averageRating = ratingValues.length ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length : 0;
    const averageLikes = totalLikes / episodes.length;
    const maxPossibleRating = ratingValues.some((value) => value > 5) ? 10 : 5;
    const variance = ratingValues.reduce((sum, value) => sum + Math.pow(value - averageRating, 2), 0);
    const stdDev = ratingValues.length > 1 ? Math.sqrt(variance / (ratingValues.length - 1)) : 0;
    const scaleFactor = maxPossibleRating / 5;
    let consistencyTier = "Standard";
    let consistencyColor = "text-neutral-400 bg-neutral-900/40 border-neutral-800";
    if (ratings.length) {
      if (stdDev <= 0.15 * scaleFactor) { consistencyTier = "Stable Masterpiece"; consistencyColor = "text-emerald-450 bg-emerald-950/20 border-emerald-900/30"; }
      else if (stdDev <= 0.35 * scaleFactor) { consistencyTier = "High Consistency"; consistencyColor = "text-teal-400 bg-teal-950/20 border-teal-900/30"; }
      else if (stdDev <= 0.6 * scaleFactor) { consistencyTier = "Moderate Variance"; consistencyColor = "text-amber-400 bg-amber-950/20 border-amber-900/30"; }
      else { consistencyTier = "Highly Polarizing"; consistencyColor = "text-rose-400 bg-rose-950/20 border-rose-900/30"; }
    }
    const splitIndex = Math.floor(chronological.length * 0.75);
    const first = chronological.slice(0, splitIndex).filter((episode) => episode.rating);
    const last = chronological.slice(splitIndex).filter((episode) => episode.rating);
    const firstAverage = first.reduce((sum, episode) => sum + (episode.rating || 0), 0) / (first.length || 1);
    const lastAverage = last.reduce((sum, episode) => sum + (episode.rating || 0), 0) / (last.length || 1);
    const trendDiff = ratings.length >= 4 ? lastAverage - firstAverage : 0;
    const trendDirection: "up" | "down" | "stable" = trendDiff > 0.05 * scaleFactor ? "up" : trendDiff < -0.05 * scaleFactor ? "down" : "stable";
    const sortedByRating = [...episodes].filter((episode) => episode.rating !== undefined).sort((a, b) => (b.rating || 0) - (a.rating || 0));
    const sortedByLikes = [...episodes].sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
    return {
      averageRating, averageLikes, totalLikes, totalEpisodes: episodes.length, maxPossibleRating,
      stdDev, consistencyTier, consistencyColor, trendDirection, trendDiff, ratingDataPoints, likesDataPoints,
      maxRatingEpisode: sortedByRating[0] || null, minRatingEpisode: sortedByRating[sortedByRating.length - 1] || null,
      maxLikesEpisode: sortedByLikes[0] || null, minLikesEpisode: sortedByLikes[sortedByLikes.length - 1] || null,
      top5ByRating: sortedByRating.slice(0, 5), bottom5ByRating: sortedByRating.slice(-5).reverse(),
      top5ByLikes: sortedByLikes.slice(0, 5), bottom5ByLikes: sortedByLikes.slice(-5).reverse(),
    };
    
  }, [episodes]);

  const hoveredEpisode = useMemo(
    () => hoveredPoint ? episodes.find((episode) => episode.number === hoveredPoint.label) || null : null,
    [hoveredPoint, episodes]
  );

  const renderTrendPath = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    if (points.length < 2) return "";
    const xStep = width / (points.length - 1);
    const valueRange = maxVal - minVal || 1;
    return points.map((point, index) => {
      const x = index * xStep;
      const y = height - ((point.value - minVal) / valueRange) * height;
      return `${x.toFixed(1)} ${y.toFixed(1)}`;
    }).reduce((path, coordinate, index) => index === 0 ? `M ${coordinate}` : `${path} L ${coordinate}`, "");
  };

  const renderTrendArea = (points: { label: string; value: number }[], width: number, height: number, minVal: number, maxVal: number) => {
    const linePath = renderTrendPath(points, width, height, minVal, maxVal);
    return linePath ? `${linePath} L ${width} ${height} L 0 ${height} Z` : "";
  };

  if (!stats) return <div className="flex flex-col items-center justify-center p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center space-y-3"><ShieldAlert className="w-10 h-10 text-neutral-500" /><h3 className="text-sm font-bold text-neutral-200">No Analytics Available</h3><p className="text-xs text-neutral-500 max-w-sm">Please scrape a WEBTOON series first to see metrics and performance charts.</p></div>;

  return <div className="space-y-6">
    <AnalyticsHeaderTabs seriesTitle={seriesTitle} activeTab={activeTab} onTabChange={setActiveTab} />
    {activeTab === "overview" && <AnalyticsOverviewTab stats={stats} />}
    {activeTab === "trends" && <AnalyticsTrendsTab stats={stats} hoveredPoint={hoveredPoint} setHoveredPoint={setHoveredPoint} hoveredEpisode={hoveredEpisode} renderTrendPath={renderTrendPath} renderTrendArea={renderTrendArea} />}
    {activeTab === "leaderboard" && <AnalyticsLeaderboardTab stats={stats} />}
  </div>;
};
