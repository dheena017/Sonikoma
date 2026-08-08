import React from "react";
import { List, BarChart2, Bookmark, Heart, Clock, Dices, Sparkles } from "lucide-react";

interface EpisodeWorkspaceTabsProps {
  activeTab: "episodes" | "analytics";
  setActiveTab: (tab: "episodes" | "analytics") => void;
  filteredEpisodeCount: number;
  bookmarksOnly: boolean;
  setBookmarksOnly: (value: boolean) => void;
  showFavorites: boolean;
  setShowFavorites: (value: boolean) => void;
  showRecent: boolean;
  setShowRecent: (value: boolean) => void;
  onRandomEpisode: () => void;
  onSelectTopN: (n: number) => void;
  readTimeEstimate: number;
}

const EpisodeWorkspaceTabs: React.FC<EpisodeWorkspaceTabsProps> = ({
  activeTab,
  setActiveTab,
  filteredEpisodeCount,
  bookmarksOnly,
  setBookmarksOnly,
  showFavorites,
  setShowFavorites,
  showRecent,
  setShowRecent,
  onRandomEpisode,
  onSelectTopN,
  readTimeEstimate,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 border border-neutral-800 bg-neutral-955 p-1.5 rounded-2xl">
        <button
          onClick={() => setActiveTab("episodes")}
          className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "episodes"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <List size={14} />
          Episodes List ({filteredEpisodeCount})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "analytics"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <BarChart2 size={14} />
          Analytics &amp; Trends
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            setActiveTab("episodes");
            setBookmarksOnly(!bookmarksOnly);
          }}
          className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            bookmarksOnly ? "bg-yellow-600 text-white" : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Bookmark size={12} className={bookmarksOnly ? "fill-current" : ""} />
          Bookmarks
        </button>
        <button
          onClick={() => {
            setActiveTab("episodes");
            setShowFavorites(!showFavorites);
            setShowRecent(false);
          }}
          className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            showFavorites ? "bg-red-500/10 text-red-400 border border-red-500/30" : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Heart size={12} />
          Favorites
        </button>
        <button
          onClick={() => {
            setActiveTab("episodes");
            setShowRecent(!showRecent);
            setShowFavorites(false);
          }}
          className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            showRecent ? "bg-blue-500/10 text-blue-400 border border-blue-500/30" : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          }`}
        >
          <Clock size={12} />
          Recent
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onRandomEpisode}
          className="px-3.5 py-2 bg-neutral-900 hover:bg-purple-955 border border-neutral-800 hover:border-purple-500/40 text-purple-300 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          title="Randomly pick an episode to preview or import"
        >
          <Dices size={14} className="text-purple-400" />
          Surprise Me!
        </button>

        <button
          onClick={() => onSelectTopN(5)}
          className="px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95"
          title="Select Top 5 Episodes"
        >
          <Sparkles size={13} className="text-amber-400" />
          Select Top 5
        </button>

        <div className="text-[11px] font-mono text-neutral-400 bg-neutral-955 border border-neutral-800 px-3 py-2 rounded-xl flex items-center gap-1.5">
          <Clock size={12} className="text-neutral-500" />
          <span>Est. Read: ~{Math.max(1, Math.round(readTimeEstimate))} mins</span>
        </div>
      </div>
    </div>
  );
};

export default EpisodeWorkspaceTabs;
