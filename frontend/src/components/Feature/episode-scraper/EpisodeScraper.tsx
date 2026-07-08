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
  Clock,
  ExternalLink,
  BookOpen,
  BarChart2,
  List,
  Eye,
  Bookmark,
  CheckCircle2,
  XCircle,
  FileJson,
  RefreshCw,
  ArrowRight
} from "lucide-react";
import { EpisodeGrid } from "./EpisodeGrid";
import { EpisodeControls } from "./EpisodeControls";
import { FavoritesManager, FavoritesList, FavoriteSeries } from "./FavoritesManager";
import { BatchThumbnailDownloader } from "./BatchThumbnailDownloader";
import { EpisodePreviewModal } from "./EpisodePreviewModal";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { NotificationType } from "@/components/notification/NotificationStack";
import type { Episode } from "./EpisodeTypes";

interface SeriesMetadata {
  title: string;
  author: string;
  genre: string;
  cover_image: string;
  description: string;
  url?: string;
}

interface EpisodeScraperProps {
  onEpisodeSelect?: (episode: Episode) => void;
  onMultipleEpisodesSelect?: (episodes: Episode[]) => void;
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
  isStandalone?: boolean;
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

const parseWebtoonDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }
  return null;
};

export const EpisodeScraper: React.FC<EpisodeScraperProps> = ({
  onEpisodeSelect,
  onMultipleEpisodesSelect,
  addNotification,
  fetchWithInterceptor,
  isStandalone = false,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [titleNoInput, setTitleNoInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(isStandalone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [filteredEpisodes, setFilteredEpisodes] = useState<Episode[]>([]);
  const [seriesMetadata, setSeriesMetadata] = useState<SeriesMetadata | null>(null);

  const [maxEpisodes, setMaxEpisodes] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"latest" | "oldest" | "rating" | "likes">("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Expanded tabs & previews
  const [activeTab, setActiveTab] = useState<"episodes" | "analytics">("episodes");
  const [previewEpisode, setPreviewEpisode] = useState<Episode | null>(null);

  // Filters
  const [bookmarkedUrls, setBookmarkedUrls] = useState<string[]>([]);
  const [readUrls, setReadUrls] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minLikes, setMinLikes] = useState<number>(0);
  const [readStatusFilter, setReadStatusFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [bookmarksOnly, setBookmarksOnly] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Multi-Select
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    active: boolean;
    title: string;
  }>({ current: 0, total: 0, active: false, title: '' });

  const cancelBatchRef = useRef(false);

  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<FavoriteSeries[]>([]);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  // Suggestions listing from favorites/recent
  useEffect(() => {
    try {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const merged = [...recents, ...favorites];
      const uniqueMap = new Map();
      merged.forEach(item => {
        if (item.url) uniqueMap.set(item.url, item);
      });
      setSuggestions(Array.from(uniqueMap.values()).slice(0, 8));
    } catch (e) {
      console.warn("Failed to load autocomplete suggestions:", e);
    }
  }, [showSuggestions]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsContainerRef.current && !suggestionsContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => {
    setBookmarkedUrls(FavoritesManager.getBookmarks());
    setReadUrls(FavoritesManager.getReadEpisodes());
  }, []);

  const scrapeEpisodesAPI = async (data: {
    url?: string;
    title_no?: string;
    max_episodes?: number | null;
    sort_by?: string;
  }) => {
    const body = { ...data };
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

  useEffect(() => {
    let result = [...episodes];

    if (sortBy === "oldest") {
      result = result.reverse();
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "likes") {
      result.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
    }

    if (searchQuery) {
      result = result.filter(
        (ep) =>
          ep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ep.number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (minRating > 0) {
      result = result.filter((ep) => (ep.rating || 0) >= minRating);
    }

    if (minLikes > 0) {
      result = result.filter((ep) => parseLikes(ep.likes) >= minLikes);
    }

    if (readStatusFilter === "read") {
      result = result.filter((ep) => readUrls.includes(ep.url));
    } else if (readStatusFilter === "unread") {
      result = result.filter((ep) => !readUrls.includes(ep.url));
    }

    if (bookmarksOnly) {
      result = result.filter((ep) => bookmarkedUrls.includes(ep.url));
    }

    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter((ep) => {
        const epDate = parseWebtoonDate(ep.date);
        return epDate && epDate >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((ep) => {
        const epDate = parseWebtoonDate(ep.date);
        return epDate && epDate <= to;
      });
    }

    setFilteredEpisodes(result);
  }, [
    episodes,
    sortBy,
    searchQuery,
    minRating,
    minLikes,
    readStatusFilter,
    bookmarksOnly,
    fromDate,
    toDate,
    readUrls,
    bookmarkedUrls
  ]);

  const triggerScrape = async (url?: string, titleNo?: string) => {
    const activeUrl = url !== undefined ? url : urlInput;
    const activeTitleNo = titleNo !== undefined ? titleNo : titleNoInput;

    if (!activeUrl && !activeTitleNo) {
      setError("Please enter a WEBTOON URL or Series ID");
      addNotification("Please enter a WEBTOON URL or Series ID", "error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEpisodes([]);
    setSeriesMetadata(null);
    setSelectedUrls([]);

    try {
      const result = await scrapeEpisodesAPI({
        url: activeUrl || undefined,
        title_no: activeTitleNo || undefined,
        max_episodes: maxEpisodes,
        sort_by: sortBy,
      });

      if (result.success) {
        setEpisodes(result.episodes || []);
        setSeriesMetadata(
          result.series
            ? { ...result.series, url: result.url || activeUrl }
            : null
        );

        if (result.series && result.title_no) {
          FavoritesManager.addRecent({
            title_no: result.title_no,
            title: result.series.title,
            genre: result.series.genre,
            cover_image: result.series.cover_image,
            timestamp: Date.now(),
            url: activeUrl || result.url || `https://www.webtoons.com/en/romance/list?title_no=${result.title_no}`,
          });

          setIsFavorite(FavoritesManager.isFavorite(result.title_no));
        }

        addNotification(`Found ${result.total_episodes || 0} episodes!`, "success");
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

  const handleScrape = () => triggerScrape();

  const handleEpisodeClick = (episode: Episode) => {
    FavoritesManager.markAsRead(episode.url);
    setReadUrls(FavoritesManager.getReadEpisodes());

    if (onEpisodeSelect) {
      onEpisodeSelect(episode);
      return;
    }

    const temporaryProjectId = `temp_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 10)}`;
    localStorage.setItem("auto_import_url", episode.url);
    window.location.assign(`/workspace/editor?id=${temporaryProjectId}`);
  };

  const handleAddToFavorites = () => {
    if (!seriesMetadata || !titleNoInput) return;

    const series: FavoriteSeries = {
      title_no: titleNoInput,
      title: seriesMetadata.title,
      genre: seriesMetadata.genre,
      cover_image: seriesMetadata.cover_image,
      timestamp: Date.now(),
      url: urlInput || seriesMetadata.url || `https://www.webtoons.com/en/romance/list?title_no=${titleNoInput}`,
    };

    FavoritesManager.addFavorite(series);
    setIsFavorite(true);
    addNotification(`Added "${seriesMetadata.title}" to favorites`, "success");
  };

  const handleSelectFromFavorites = (series: FavoriteSeries) => {
    const url = series.url || "";
    const titleNo = series.title_no;

    if (url) {
      setUrlInput(url);
      setTitleNoInput("");
    } else {
      setTitleNoInput(titleNo);
      setUrlInput("");
    }
    setShowFavorites(false);
    setShowRecent(false);
    setIsExpanded(true);

    triggerScrape(url, url ? undefined : titleNo);
  };

  const handleBookmarkToggle = (url: string) => {
    const isBookmarked = FavoritesManager.isBookmarked(url);
    if (isBookmarked) {
      FavoritesManager.removeBookmark(url);
      addNotification("Removed bookmark", "info");
    } else {
      FavoritesManager.addBookmark(url);
      addNotification("Episode bookmarked", "success");
    }
    setBookmarkedUrls(FavoritesManager.getBookmarks());
  };

  const handleToggleSelect = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  const handleBatchMarkRead = () => {
    selectedUrls.forEach((url) => FavoritesManager.markAsRead(url));
    setReadUrls(FavoritesManager.getReadEpisodes());
    setSelectedUrls([]);
    addNotification(`Marked ${selectedUrls.length} episodes as read`, "success");
  };

  const handleBatchMarkUnread = () => {
    selectedUrls.forEach((url) => FavoritesManager.markAsUnread(url));
    setReadUrls(FavoritesManager.getReadEpisodes());
    setSelectedUrls([]);
    addNotification(`Marked ${selectedUrls.length} episodes as unread`, "success");
  };

  const handleBatchBookmark = () => {
    const allBookmarked = selectedUrls.every((url) => bookmarkedUrls.includes(url));
    if (allBookmarked) {
      selectedUrls.forEach((url) => FavoritesManager.removeBookmark(url));
      addNotification(`Removed ${selectedUrls.length} bookmarks`, "info");
    } else {
      selectedUrls.forEach((url) => FavoritesManager.addBookmark(url));
      addNotification(`Bookmarked ${selectedUrls.length} episodes`, "success");
    }
    setBookmarkedUrls(FavoritesManager.getBookmarks());
    setSelectedUrls([]);
  };

  const handleBatchScrape = async () => {
    cancelBatchRef.current = false;
    setBatchProgress({
      current: 0,
      total: selectedUrls.length,
      active: true,
      title: 'Initializing batch import...'
    });

    const urlsToScrape = [...selectedUrls];
    let importedCount = 0;

    for (let i = 0; i < urlsToScrape.length; i++) {
      if (cancelBatchRef.current) {
        addNotification("Batch import cancelled", "info");
        break;
      }

      const url = urlsToScrape[i];
      const ep = episodes.find((e) => e.url === url);
      const epTitle = ep ? `${ep.number} - ${ep.title}` : url;

      setBatchProgress((p) => ({
        ...p,
        current: i + 1,
        title: `Scraping: ${epTitle}`
      }));

      try {
        const res = await fetchWithInterceptor("/api/scrape-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: url,
            smart_slice: true,
            bypass_cache: true,
            scrape_only: false
          })
        });

        if (res.ok) {
          FavoritesManager.markAsRead(url);
          importedCount++;
        }
      } catch (err) {
        console.error(`Failed to batch import ${url}:`, err);
      }
    }

    setReadUrls(FavoritesManager.getReadEpisodes());
    setSelectedUrls([]);
    setBatchProgress({ current: 0, total: 0, active: false, title: '' });
    
    if (importedCount > 0) {
      addNotification(`Successfully imported ${importedCount} projects!`, "success");
    }
  };

  const handleExportCSV = () => {
    if (filteredEpisodes.length === 0) return;
    const headers = ["Episode Number", "Title", "Date", "Rating", "Likes", "URL"];
    const rows = filteredEpisodes.map((ep) => [
      `"${ep.number.replace(/"/g, '""')}"`,
      `"${ep.title.replace(/"/g, '""')}"`,
      `"${ep.date.replace(/"/g, '""')}"`,
      ep.rating ?? "",
      ep.likes ?? "",
      `"${ep.url}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${seriesMetadata?.title || 'series'}_episodes.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (filteredEpisodes.length === 0) return;
    const jsonContent = JSON.stringify(filteredEpisodes, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${seriesMetadata?.title || 'series'}_episodes.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setMinRating(0);
    setMinLikes(0);
    setReadStatusFilter('all');
    setBookmarksOnly(false);
    setFromDate('');
    setToDate('');
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. CONFIGURATION / SEARCH BOX */}
      <div 
        id="scraper_config_box" 
        className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl relative z-20"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Import Series Metadata</h2>
              <p className="text-xs text-neutral-500 mt-0.5">Scrape details, ratings, likes, and episode chapters</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input 1: Series URL */}
          <div className="relative space-y-2 md:col-span-2" ref={suggestionsContainerRef}>
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              Webtoon Series URL
            </label>
            <div className="relative group">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-500" />
              <input
                type="text"
                autoComplete="off"
                placeholder="https://www.webtoons.com/en/action/duo-leveling/list?title_no=10193"
                value={urlInput}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setShowSuggestions(false);
                }}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3.5 text-sm text-neutral-200 outline-none focus:border-purple-500 transition-all shadow-inner"
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/40">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                      Recent & Favorite Series
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800/50">
                    {suggestions.map((series, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (series.url) setUrlInput(series.url);
                          else if (series.title_no) setTitleNoInput(series.title_no);
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-neutral-800/60 flex items-center gap-3 transition-colors text-left"
                      >
                        {series.cover_image && (
                          <img
                            src={`/api/proxy-image?url=${encodeURIComponent(series.cover_image)}`}
                            alt=""
                            className="w-8 h-8 object-cover rounded-lg border border-neutral-800 flex-shrink-0"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-neutral-200 truncate">{series.title}</p>
                          <p className="text-[9px] text-neutral-600 font-mono truncate">{series.url}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input 2: Series ID */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              Series ID
            </label>
            <input
              type="text"
              autoComplete="off"
              placeholder="e.g. 10193"
              value={titleNoInput}
              onChange={(e) => setTitleNoInput(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-3.5 text-sm text-neutral-200 outline-none focus:border-purple-500 transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between mt-6 pt-4 border-t border-neutral-800/60">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowFavorites(!showFavorites);
                setShowRecent(false);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showFavorites
                  ? "bg-red-500/10 text-red-400 border-red-500/30"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Heart size={14} className={showFavorites ? "fill-current" : ""} />
              Favorites
            </button>
            <button
              onClick={() => {
                setShowRecent(!showRecent);
                setShowFavorites(false);
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 ${
                showRecent
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Clock size={14} />
              Recent
            </button>
          </div>

          <button
            onClick={handleScrape}
            disabled={isLoading}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-neutral-800 disabled:to-neutral-800 disabled:text-neutral-600 text-white text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center gap-2"
          >
            {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Zap size={14} />}
            Scrape Episodes
          </button>
        </div>

        {/* Favorites list / Recent list containers */}
        {(showFavorites || showRecent) && (
          <div className="mt-6 p-4 bg-neutral-950/60 border border-neutral-850 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <h3 className="text-xs font-bold text-neutral-400 mb-3 flex items-center gap-1">
              {showFavorites ? <Heart size={12} className="fill-current text-red-500" /> : <Clock size={12} />}
              {showFavorites ? "Favorite Series" : "Recently Scraped Series"}
            </h3>
            <FavoritesList onSelectSeries={handleSelectFromFavorites} showRecent={showRecent} />
          </div>
        )}
      </div>

      {/* 2. ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/35 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in shake duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 3. METADATA BRIEF VIEW */}
      {seriesMetadata && (
        <div className="bg-neutral-900/30 border border-neutral-800/80 p-6 rounded-3xl flex flex-col md:flex-row gap-6 relative overflow-hidden backdrop-blur-sm">
          {seriesMetadata.cover_image && (
            <img
              src={`/api/proxy-image?url=${encodeURIComponent(seriesMetadata.cover_image)}`}
              alt={seriesMetadata.title}
              className="w-full md:w-36 h-48 md:h-auto object-cover rounded-2xl border border-neutral-800/60 flex-shrink-0 shadow-lg"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
              }}
            />
          )}
          <div className="flex-grow min-w-0 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-lg font-bold text-white truncate">{seriesMetadata.title}</h1>
                <button
                  onClick={handleAddToFavorites}
                  className={`p-2 rounded-xl border transition-all ${
                    isFavorite
                      ? "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <Heart size={16} className={isFavorite ? "fill-current" : ""} />
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1 font-mono">
                Author: <span className="text-neutral-300 mr-4">{seriesMetadata.author || "Unknown"}</span>
                Genre: <span className="text-neutral-300">{seriesMetadata.genre || "N/A"}</span>
              </p>
              <p className="text-xs text-neutral-400 mt-4 leading-relaxed line-clamp-3">
                {seriesMetadata.description}
              </p>
            </div>
            {seriesMetadata.url && (
              <div className="mt-4 flex items-center gap-2">
                <a
                  href={seriesMetadata.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  Original Webtoon URL <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. ACTIVE WORKSPACE CONTAINER (EPISODES VS ANALYTICS) */}
      {episodes.length > 0 && (
        <div className="space-y-6">
          {/* Glassmorphic Tabs Bar */}
          <div className="flex border border-neutral-800 bg-neutral-950/60 p-1.5 rounded-2xl w-fit gap-2">
            <button
              onClick={() => setActiveTab("episodes")}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "episodes"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <List size={14} />
              Episodes List ({filteredEpisodes.length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-5 py-2 text-xs font-semibold rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "analytics"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <BarChart2 size={14} />
              Analytics & Trends
            </button>
          </div>

          {/* TAB VIEW 1: EPISODE GRID & CONTROLS */}
          {activeTab === "episodes" && (
            <div className="space-y-6">
              <EpisodeControls
                onSortChange={setSortBy}
                onSearchChange={setSearchQuery}
                onDateRangeChange={(from, to) => {
                  setFromDate(from);
                  setToDate(to);
                }}
                onToggleFavorites={() => setShowFavorites(!showFavorites)}
                onToggleRecent={() => setShowRecent(!showRecent)}
                showFavorites={showFavorites}
                showRecent={showRecent}
                minRating={minRating}
                onMinRatingChange={setMinRating}
                minLikes={minLikes}
                onMinLikesChange={setMinLikes}
                readStatus={readStatusFilter}
                onReadStatusChange={setReadStatusFilter}
                bookmarksOnly={bookmarksOnly}
                onBookmarksOnlyToggle={() => setBookmarksOnly(!bookmarksOnly)}
                isMultiSelectMode={isMultiSelectMode}
                onToggleMultiSelectMode={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  setSelectedUrls([]);
                }}
                onClearFilters={handleClearFilters}
                onExportCSV={handleExportCSV}
                onExportJSON={handleExportJSON}
              />

              {/* Multi-Select Floating Drawer */}
              {isMultiSelectMode && selectedUrls.length > 0 && (
                <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                  <div className="text-xs font-medium text-purple-300">
                    Selected <span className="font-bold text-white">{selectedUrls.length}</span> episodes
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={handleBatchMarkRead}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 transition-colors"
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={handleBatchMarkUnread}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 transition-colors"
                    >
                      Mark Unread
                    </button>
                    <button
                      onClick={handleBatchBookmark}
                      className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-200 text-xs font-semibold rounded-xl border border-neutral-800 transition-colors"
                    >
                      Bookmark
                    </button>
                    <button
                      onClick={handleBatchScrape}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg transition-colors flex items-center gap-1.5"
                    >
                      <Zap size={13} />
                      Import Batch
                    </button>
                  </div>
                </div>
              )}

              {/* Batch Processing Status Overlay */}
              {batchProgress.active && (
                <div className="bg-neutral-950/90 border border-neutral-850 p-6 rounded-2xl space-y-3 relative z-30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-white">{batchProgress.title}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Processing {batchProgress.current} of {batchProgress.total}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        cancelBatchRef.current = true;
                      }}
                      className="px-3 py-1.5 bg-red-600/10 hover:bg-red-650/20 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 transition-all"
                    >
                      Cancel Import
                    </button>
                  </div>
                  <div className="w-full bg-neutral-900 rounded-full h-2.5 overflow-hidden border border-neutral-850">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full transition-all duration-300"
                      style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Episode Grid View */}
              {filteredEpisodes.length > 0 ? (
                <div className="bg-neutral-950/25 border border-neutral-900/60 rounded-3xl p-2 sm:p-4">
                  <EpisodeGrid
                    episodes={filteredEpisodes}
                    onEpisodeClick={handleEpisodeClick}
                    onPreviewClick={setPreviewEpisode}
                    onBookmarkToggle={handleBookmarkToggle}
                    bookmarkedUrls={bookmarkedUrls}
                    readUrls={readUrls}
                    isMultiSelectMode={isMultiSelectMode}
                    selectedUrls={selectedUrls}
                    onToggleSelect={handleToggleSelect}
                  />
                </div>
              ) : (
                <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-3xl space-y-2">
                  <p className="text-sm font-semibold text-neutral-450">No episodes matched your search criteria.</p>
                  <p className="text-xs text-neutral-600">Try adjusting your filters, date ranges, or search query.</p>
                </div>
              )}

              {/* Zip Downloader Footer Tool */}
              {seriesMetadata && filteredEpisodes.length > 0 && (
                <div className="p-4 bg-neutral-900/20 border border-neutral-850/80 rounded-2xl">
                  <BatchThumbnailDownloader episodes={filteredEpisodes} seriesTitle={seriesMetadata.title} />
                </div>
              )}
            </div>
          )}

          {/* TAB VIEW 2: ANALYTICS & TRENDS */}
          {activeTab === "analytics" && (
            <div className="bg-neutral-950/25 border border-neutral-900/60 rounded-3xl p-6">
              <AnalyticsDashboard episodes={episodes} seriesTitle={seriesMetadata?.title || "Scraped Series"} />
            </div>
          )}
        </div>
      )}

      {/* QUICK PREVIEW LIGHTBOX MODAL */}
      {previewEpisode && (
        <EpisodePreviewModal
          episode={previewEpisode}
          onClose={() => setPreviewEpisode(null)}
          onImport={(ep) => {
            // Preview modal uses the shared Episode type; safe to forward
            setPreviewEpisode(null);
            handleEpisodeClick(ep);
          }}

          fetchWithInterceptor={fetchWithInterceptor}
        />
      )}
    </div>
  );
};
