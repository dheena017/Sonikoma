import React from "react";
import { List, Bookmark, Clock, Loader } from "lucide-react";

interface EpisodeWorkspaceTabsProps {
  activeTab: "episodes" | "bookmarks" | "recent";
  setActiveTab: (tab: "episodes" | "bookmarks" | "recent") => void;
  filteredEpisodeCount: number;
  setBookmarksOnly: (value: boolean) => void;
  setShowFavorites: (value: boolean) => void;
  setShowRecent: (value: boolean) => void;
  isLoading?: boolean;
}

const EpisodeWorkspaceTabs: React.FC<EpisodeWorkspaceTabsProps> = ({
  activeTab,
  setActiveTab,
  filteredEpisodeCount,
  setBookmarksOnly,
  setShowFavorites,
  setShowRecent,
  isLoading = false,
}) => {
  const isEpisodesTabActive = activeTab === "episodes";

  return (
    <div className="grid grid-cols-1 items-center gap-3">
      <div
        role="tablist"
        aria-label="Episode scraper views"
        className="grid grid-cols-3 items-center gap-1.5 border border-neutral-800 bg-neutral-955 p-1.5 rounded-2xl"
      >
        <button
          disabled={isLoading}
          type="button"
          role="tab"
          aria-selected={isEpisodesTabActive}
          aria-controls="episode-scraper-view"
          onClick={() => {
            setActiveTab("episodes");
            setBookmarksOnly(false);
            setShowFavorites(false);
            setShowRecent(false);
          }}
          className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            isEpisodesTabActive
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          } w-full justify-center`}
        >
          {isLoading ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <List size={14} />
          )}
          Episodes List ({isLoading ? 0 : filteredEpisodeCount})
        </button>
        <button
          disabled={isLoading}
          type="button"
          role="tab"
          aria-selected={activeTab === "bookmarks"}
          aria-controls="episode-scraper-view"
          onClick={() => {
            setActiveTab("bookmarks");
            setBookmarksOnly(true);
            setShowFavorites(false);
            setShowRecent(false);
          }}
          className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "bookmarks"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          } w-full justify-center`}
        >
          <Bookmark
            size={12}
            className={activeTab === "bookmarks" ? "fill-current" : ""}
          />
          Bookmarks
        </button>
        <button
          disabled={isLoading}
          type="button"
          role="tab"
          aria-selected={activeTab === "recent"}
          aria-controls="episode-scraper-view"
          onClick={() => {
            setActiveTab("recent");
            setBookmarksOnly(false);
            setShowRecent(true);
            setShowFavorites(false);
          }}
          className={`px-4 py-2 text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "recent"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
              : "text-neutral-400 hover:text-white hover:bg-neutral-900"
          } w-full justify-center`}
        >
          <Clock size={12} />
          Recent
        </button>
      </div>
    </div>
  );
};

export default EpisodeWorkspaceTabs;
