import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Loader,
  AlertCircle,
  Play,
  Download,
  Zap,
  ChevronDown,
  Heart,
} from "lucide-react";
import { EpisodeGrid } from "./EpisodeGrid";
import { EpisodeControls } from "./EpisodeControls";
import { FavoritesManager, FavoritesList, FavoriteSeries } from "./FavoritesManager";
import { BatchThumbnailDownloader } from "./BatchThumbnailDownloader";
import { NotificationType } from "@/components/notification/NotificationStack";

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

interface SeriesMetadata {
  title: string;
  author: string;
  genre: string;
  cover_image: string;
  description: string;
}

interface EpisodeScraperProps {
  onEpisodeSelect?: (episode: Episode) => void;
  onMultipleEpisodesSelect?: (episodes: Episode[]) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
}

export const EpisodeScraper: React.FC<EpisodeScraperProps> = ({
  onEpisodeSelect,
  onMultipleEpisodesSelect,
  addNotification,
  fetchWithInterceptor,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [titleNoInput, setTitleNoInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [seriesMetadata, setSeriesMetadata] = useState<SeriesMetadata | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [maxEpisodes, setMaxEpisodes] = useState<number | null>(null);  // null = get all episodes
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "rating" | "likes">("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Import the scrapeEpisodes function
  const scrapeEpisodes = async (data: {
    url?: string;
    title_no?: string;
    max_episodes?: number | null;
    sort_by?: string;
  }) => {
    const body = { ...data };
    // Only include max_episodes if it's specified (not null)
    if (body.max_episodes === null) {
      delete body.max_episodes;
    }
    const res = await fetchWithInterceptor("/api/scrape-episodes-advanced", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  // Filter and sort episodes
  useEffect(() => {
    let result = [...episodes];

    // Apply sorting
    if (sortBy === "oldest") {
      result = result.reverse();
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "likes") {
      result.sort((a, b) => {
        const aLikes = parseInt(a.likes?.replace(/[KMB]/g, "") || "0");
        const bLikes = parseInt(b.likes?.replace(/[KMB]/g, "") || "0");
        return bLikes - aLikes;
      });
    }

    // Apply search filter
    if (searchQuery) {
      result = result.filter((ep) =>
        ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ep.number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredEpisodes(result);
  }, [episodes, sortBy, searchQuery]);

  const handleScrape = async () => {
    if (!urlInput && !titleNoInput) {
      setError("Please enter a WEBTOON URL or Series ID");
      addNotification("Please enter a WEBTOON URL or Series ID", "error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEpisodes([]);
    setSelectedIndices([]);
    setSeriesMetadata(null);

    try {
      const result = await scrapeEpisodes({
        url: urlInput || undefined,
        title_no: titleNoInput || undefined,
        max_episodes: maxEpisodes,
        sort_by: sortBy,
      });

      if (result.success) {
        setEpisodes(result.episodes || []);
        setSeriesMetadata(result.series || null);

        // Save to favorites
        if (result.series && result.title_no) {
          FavoritesManager.addRecent({
            title_no: result.title_no,
            title: result.series.title,
            genre: result.series.genre,
            cover_image: result.series.cover_image,
            timestamp: Date.now(),
          });

          setIsFavorite(FavoritesManager.isFavorite(result.title_no));
        }

        addNotification(
          `Found ${result.total_episodes || 0} episodes!`,
          "success"
        );
      } else {
        const errorMsg = result.error || "Failed to scrape episodes";
        setError(errorMsg);
        addNotification(errorMsg, "error");
      }
    } catch (err: any) {
      const errorMsg = err.message || "An error occurred while scraping";
      setError(errorMsg);
      addNotification(errorMsg, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectEpisode = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectedIndices(filteredEpisodes.map((_, i) => i));
  };

  const handleClearSelection = () => {
    setSelectedIndices([]);
  };

  const handleGenerateVideos = () => {
    if (selectedIndices.length === 0) {
      addNotification("Please select at least one episode", "warning");
      return;
    }

    const selectedEpisodes = selectedIndices
      .map((i) => filteredEpisodes[i])
      .filter(Boolean);

    if (onMultipleEpisodesSelect) {
      onMultipleEpisodesSelect(selectedEpisodes);
    }

    addNotification(
      `Selected ${selectedEpisodes.length} episodes for video generation`,
      "success"
    );
  };

  const handleAddToFavorites = () => {
    if (!seriesMetadata || !titleNoInput) return;

    const series: FavoriteSeries = {
      title_no: titleNoInput,
      title: seriesMetadata.title,
      genre: seriesMetadata.genre,
      cover_image: seriesMetadata.cover_image,
      timestamp: Date.now(),
    };

    FavoritesManager.addFavorite(series);
    setIsFavorite(true);
    addNotification(`Added "${seriesMetadata.title}" to favorites`, "success");
  };

  const handleSelectFromFavorites = (series: FavoriteSeries) => {
    setTitleNoInput(series.title_no);
    setUrlInput("");
    setShowFavorites(false);
  };

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="w-full space-y-4">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg hover:from-purple-800/50 hover:to-blue-800/50 transition-all duration-200 border border-purple-700/30"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-gray-100">WEBTOON Episode Scraper</span>
          {seriesMetadata && (
            <span className="text-sm text-gray-400 ml-2">
              • {seriesMetadata.title}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          {/* Input Section */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                WEBTOON Series URL
              </label>
              <input
                ref={inputRef}
                type="text"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setTitleNoInput("");
                  setError(null);
                }}
                placeholder="https://www.webtoons.com/en/romance/love-by-mistake/list?title_no=10411"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div className="text-center text-sm text-gray-500">— OR —</div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Series ID (title_no)
              </label>
              <input
                type="text"
                value={titleNoInput}
                onChange={(e) => {
                  setTitleNoInput(e.target.value);
                  setUrlInput("");
                  setError(null);
                }}
                placeholder="10411"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Episodes to Load (leave empty for all)
              </label>
              <input
                type="number"
                value={maxEpisodes ?? ""}
                onChange={(e) => setMaxEpisodes(e.target.value === "" ? null : Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="500"
                placeholder="Leave empty to load all episodes"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              />
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Series Metadata Display */}
          {seriesMetadata && (
            <div className="p-3 bg-blue-900/20 border border-blue-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-blue-100">
                    {seriesMetadata.title}
                  </h3>
                  <p className="text-xs text-blue-300 mt-1">{seriesMetadata.description}</p>
                </div>
                <button
                  onClick={handleAddToFavorites}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    isFavorite
                      ? "bg-red-600 text-white"
                      : "bg-gray-700 text-gray-300 hover:bg-red-600/50"
                  }`}
                >
                  <Heart size={14} className="inline mr-1" />
                  {isFavorite ? "Favorited" : "Add to Favorites"}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400">Author: </span>
                  <span className="text-gray-200">{seriesMetadata.author}</span>
                </div>
                <div>
                  <span className="text-gray-400">Genre: </span>
                  <span className="text-gray-200">{seriesMetadata.genre}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleScrape}
              disabled={isLoading || (!urlInput && !titleNoInput)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Scrape Episodes
                </>
              )}
            </button>

            {selectedIndices.length > 0 && (
              <button
                onClick={handleGenerateVideos}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                Generate Videos ({selectedIndices.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Favorites & Recent Section */}
      {(showFavorites || showRecent) && (
        <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
          <h3 className="text-sm font-semibold text-gray-200">
            {showRecent ? "Recently Browsed" : "Favorite Series"}
          </h3>
          <FavoritesList
            showRecent={showRecent}
            onSelectSeries={handleSelectFromFavorites}
          />
        </div>
      )}

      {/* Episode Controls */}
      {episodes.length > 0 && (
        <EpisodeControls
          onSortChange={setSortBy}
          onSearchChange={setSearchQuery}
          onDateRangeChange={() => {}}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          onToggleRecent={() => setShowRecent(!showRecent)}
          showFavorites={showFavorites}
          showRecent={showRecent}
        />
      )}

      {/* Episodes Grid */}
      {filteredEpisodes.length > 0 && (
        <div className="space-y-4">
          <EpisodeGrid
            episodes={filteredEpisodes}
            selectedIndices={selectedIndices}
            onSelectEpisode={handleSelectEpisode}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
          />

          {/* Batch Actions */}
          <div className="space-y-3">
            <div className="flex gap-2 px-4 py-3 bg-gray-800 rounded-lg">
              <button
                onClick={handleGenerateVideos}
                disabled={selectedIndices.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-all duration-200"
              >
                <Play className="w-4 h-4" />
                Generate Videos for Selected ({selectedIndices.length})
              </button>
              <button
                onClick={handleClearSelection}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded-lg transition-all duration-200"
              >
                Clear Selection
              </button>
            </div>

            {/* Batch Thumbnail Downloader */}
            {filteredEpisodes.length > 0 && (
              <BatchThumbnailDownloader
                episodes={filteredEpisodes}
                seriesTitle={seriesMetadata?.title || "episodes"}
                onDownloadStart={() => addNotification("Starting download...", "info")}
                onDownloadComplete={(count) =>
                  addNotification(`Downloaded ${count} thumbnails!`, "success")
                }
              />
            )}
          </div>
        </div>
      )}

      {/* No Results Message */}
      {episodes.length > 0 && filteredEpisodes.length === 0 && (
        <div className="p-4 text-center text-gray-400 bg-gray-800 rounded-lg">
          <p className="text-sm">No episodes match your search or filters</p>
        </div>
      )}
    </div>
  );
};
