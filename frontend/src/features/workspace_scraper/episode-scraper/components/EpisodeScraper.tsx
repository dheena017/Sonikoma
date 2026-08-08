import React, { useState, useRef, useEffect } from "react";
import { createTempProjectId } from "@/shared/utils/workspaceNavigation";
import { createPortal } from "react-dom";
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
  ArrowRight,
  Dices,
  Sparkles,
  Copy,
  FileText,
  Star,
  Flame,
} from "lucide-react";
import { EpisodeGrid } from "./EpisodeGrid";
import { EpisodeControls } from "./EpisodeControls";
import SeriesMetadataCard from "./SeriesMetadataCard";
import EpisodeWorkspaceTabs from "./EpisodeWorkspaceTabs";
import { FavoritesManager, FavoritesList, FavoriteSeries, FAVORITES_UPDATED_EVENT } from "../utils/FavoritesManager";
import { BatchThumbnailDownloader } from "./BatchThumbnailDownloader";
import { EpisodePreviewModal } from "./EpisodePreviewModal";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { NotificationType } from "@/features/app_notification";
import type { Episode } from "../types/EpisodeTypes";
import { isKnownSite, addCustomSite, getProxiedImageUrl } from "@/shared/utils/url";
import { makeSafeFilename } from "@/shared/utils/downloadNaming";

interface SeriesMetadata {
  seriesSlug?: string;
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
  const [startEpisodeNum, setStartEpisodeNum] = useState<string>('');
  const [endEpisodeNum, setEndEpisodeNum] = useState<string>('');

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
  const [customSiteAdded, setCustomSiteAdded] = useState(false);

  // Reset "Added" badge whenever URL input changes
  useEffect(() => { setCustomSiteAdded(false); }, [urlInput]);

  // Suggestions listing from favorites/recent
  useEffect(() => {
    const refreshSuggestions = () => {
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
    };

    refreshSuggestions();

    const handleFavoritesChanged = () => refreshSuggestions();
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChanged);
    window.addEventListener('storage', handleFavoritesChanged);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesChanged);
      window.removeEventListener('storage', handleFavoritesChanged);
    };
  }, []);

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
    bypass_cache?: boolean;
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

    if (startEpisodeNum !== '') {
      const start = parseInt(startEpisodeNum, 10);
      if (!isNaN(start)) {
        result = result.filter((ep) => (ep.chapter_number ?? 0) >= start);
      }
    }
    if (endEpisodeNum !== '') {
      const end = parseInt(endEpisodeNum, 10);
      if (!isNaN(end)) {
        result = result.filter((ep) => (ep.chapter_number ?? Infinity) <= end);
      }
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
    startEpisodeNum,
    endEpisodeNum,
    fromDate,
    toDate,
    readUrls,
    bookmarkedUrls
  ]);

  const triggerScrape = async (url?: string, titleNo?: string, bypassCache = true) => {
    const activeUrl = url !== undefined ? url : urlInput;
    const activeTitleNo = titleNo !== undefined ? titleNo : titleNoInput;

    if (!activeUrl && !activeTitleNo) {
      setError("Please enter a Comic, Manga, or Manhwa URL");
      addNotification("Please enter a Comic, Manga, or Manhwa URL", "error");
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
        bypass_cache: bypassCache,
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

        const cacheNote = result.from_cache ? " (from cache)" : " (fresh)";
        addNotification(`Found ${result.total_episodes || 0} episodes!${cacheNote}`, "success");
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
  const handleRefresh = () => triggerScrape(undefined, undefined, true);

  // Auto-fill and auto-scrape URL if passed via query params or localStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("url");
    const storedUrl = localStorage.getItem("episode_scraper_url");
    const target = paramUrl || storedUrl;

    if (target) {
      setUrlInput(target);
      localStorage.removeItem("episode_scraper_url");

      // Clear filters and search so the scraper shows all episodes by default
      setMinRating(0);
      setMinLikes(0);
      setReadStatusFilter('all');
      setBookmarksOnly(false);
      setFromDate('');
      setToDate('');
      setStartEpisodeNum('');
      setEndEpisodeNum('');
      setSearchQuery('');
      setSelectedUrls([]);
      setIsMultiSelectMode(false);
      setShowFavorites(false);
      setShowRecent(false);

      if (paramUrl) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("url");
        const newSearch = newParams.toString();
        const newUrl = window.location.pathname + (newSearch ? "?" + newSearch : "");
        window.history.replaceState(null, "", newUrl);
      }

      triggerScrape(target);
    }
  }, []);

  const handleEpisodeClick = (episode: Episode) => {
    FavoritesManager.markAsRead(episode.url);
    setReadUrls(FavoritesManager.getReadEpisodes());

    if (onEpisodeSelect) {
      onEpisodeSelect(episode);
      return;
    }

    const temporaryProjectId = createTempProjectId(seriesMetadata?.seriesSlug || seriesMetadata?.title || titleNoInput);
    localStorage.setItem("auto_import_url", episode.url);
    const nav = (window as any).navigateTo;
    if (nav) {
      nav(`/scraper/editor?id=${temporaryProjectId}`);
    } else {
      window.location.assign(`/scraper/editor?id=${temporaryProjectId}`);
    }
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
    if (selectedUrls.length === 0) return;

    selectedUrls.forEach((url) => FavoritesManager.markAsRead(url));
    setReadUrls(FavoritesManager.getReadEpisodes());

    const selectedEpObjects = episodes.filter((ep) => selectedUrls.includes(ep.url));
    const fallbackList: Episode[] = selectedUrls.map((url, idx) => ({
      url,
      number: `Episode ${idx + 1}`,
      title: "",
      date: "",
      thumbnail: "",
      index: idx,
    }));
    const finalEpisodes = selectedEpObjects.length > 0 ? selectedEpObjects : fallbackList;

    if (onMultipleEpisodesSelect) {
      onMultipleEpisodesSelect(finalEpisodes);
      return;
    }

    const temporaryProjectId = createTempProjectId(seriesMetadata?.seriesSlug || seriesMetadata?.title || titleNoInput);

    localStorage.setItem("auto_import_batch", JSON.stringify(finalEpisodes));
    localStorage.setItem("auto_import_url", finalEpisodes[0].url);
    const nav = (window as any).navigateTo;
    if (nav) {
      nav(`/scraper/editor?id=${temporaryProjectId}`);
    } else {
      window.location.assign(`/scraper/editor?id=${temporaryProjectId}`);
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
    const safeSeries = makeSafeFilename(seriesMetadata?.title, "Webtoon_Series");
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${safeSeries}_episodes_${dateStr}.csv`;
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
    const safeSeries = makeSafeFilename(seriesMetadata?.title, "Webtoon_Series");
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${safeSeries}_episodes_${dateStr}.json`;
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
    setStartEpisodeNum('');
    setEndEpisodeNum('');
  };

  const handleRandomEpisode = () => {
    if (filteredEpisodes.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredEpisodes.length);
    const randomEp = filteredEpisodes[randomIndex];
    setPreviewEpisode(randomEp);
    addNotification(`Randomly picked ${randomEp.number}: "${randomEp.title || 'Untitled'}"!`, "info");
  };

  const handleSelectTopN = (n: number) => {
    if (filteredEpisodes.length === 0) return;
    const topN = filteredEpisodes.slice(0, n).map(e => e.url);
    setIsMultiSelectMode(true);
    setSelectedUrls(topN);
    addNotification(`Selected top ${topN.length} episodes!`, "success");
  };

  const handleCopyAiPrompt = () => {
    if (!seriesMetadata) return;
    const prompt = `Series Title: ${seriesMetadata.title}
Author: ${seriesMetadata.author || 'Unknown'}
Genre: ${seriesMetadata.genre || 'Webtoon'}
Synopsis: ${seriesMetadata.description || 'N/A'}
Total Episodes: ${episodes.length}
URL: ${seriesMetadata.url || ''}

Task: Generate a detailed video recap script, panel selection strategy, and AI voiceover narration breakdown for this series.`;

    navigator.clipboard.writeText(prompt);
    addNotification("Copied AI Script Prompt to clipboard!", "success");
  };

  return (
    <div className="w-full space-y-6">
      {/* Scraper configuration box removed — moved into workspace header */}

      {/* 2. ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/35 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in shake duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* 3. METADATA BRIEF VIEW */}
      {seriesMetadata && (
        <SeriesMetadataCard
          seriesMetadata={seriesMetadata}
          urlInput={urlInput}
          isFavorite={isFavorite}
          onAddToFavorites={handleAddToFavorites}
          onCopyAiPrompt={handleCopyAiPrompt}
        />
      )}

      {/* 4. ACTIVE WORKSPACE CONTAINER (EPISODES VS ANALYTICS) */}
      {episodes.length > 0 ? (
        <div className="space-y-6">
          {/* Glassmorphic Tabs Bar & Quick Actions */}
          <EpisodeWorkspaceTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            filteredEpisodeCount={filteredEpisodes.length}
            bookmarksOnly={bookmarksOnly}
            setBookmarksOnly={setBookmarksOnly}
            showFavorites={showFavorites}
            setShowFavorites={setShowFavorites}
            showRecent={showRecent}
            setShowRecent={setShowRecent}
            onRandomEpisode={handleRandomEpisode}
            onSelectTopN={handleSelectTopN}
            readTimeEstimate={filteredEpisodes.length * 3.5}
          />

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
                startEpisodeNum={startEpisodeNum}
                onStartEpisodeChange={setStartEpisodeNum}
                endEpisodeNum={endEpisodeNum}
                onEndEpisodeChange={setEndEpisodeNum}
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
                <div className="bg-neutral-955 border border-neutral-850 p-6 rounded-2xl space-y-3 relative z-30">
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
                <div className="bg-neutral-955 border border-neutral-900/60 rounded-3xl p-2 sm:p-4">
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
            <div className="bg-neutral-955 border border-neutral-900/60 rounded-3xl p-6">
              <AnalyticsDashboard episodes={episodes} seriesTitle={seriesMetadata?.title || "Scraped Series"} />
            </div>
          )}
        </div>
      ) : (
        /* RICH EMPTY STATE WORKSPACE DASHBOARD (WHEN NO EPISODES ARE LOADED) */
        !isLoading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* DYNAMIC USER RECENT / FAVORITE SERIES (IF ANY EXIST) */}
            {suggestions.length > 0 ? (
              <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-6 sm:p-8 backdrop-blur-md space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">Your Recent &amp; Favorite Series</h3>
                      <p className="text-xs text-neutral-400 font-mono mt-0.5">Click any series below to load episodes instantly</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {suggestions.map((series, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (series.url) setUrlInput(series.url);
                        if (series.title_no) setTitleNoInput(series.title_no);
                        triggerScrape(series.url, series.title_no);
                      }}
                      className="group bg-neutral-955 hover:bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 rounded-2xl p-4 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center gap-4"
                    >
                      {series.cover_image ? (
                        <img
                          src={getProxiedImageUrl(series.cover_image, series.url || urlInput)}
                          alt={series.title}
                          className="w-14 h-18 object-cover rounded-xl border border-neutral-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-14 h-18 bg-purple-950/20 border border-purple-800/30 rounded-xl flex items-center justify-center text-purple-400 flex-shrink-0">
                          <BookOpen className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-grow min-w-0 space-y-1">
                        {series.genre && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/20 font-mono">
                            {series.genre}
                          </span>
                        )}
                        <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                          {series.title || "Untitled Series"}
                        </h4>
                        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-purple-400">
                          <span>Load Episodes</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* DYNAMIC WORKFLOW & GETTING STARTED GUIDE */
              <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 text-center space-y-6 backdrop-blur-md">
                <div className="w-14 h-14 rounded-3xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                  <Zap className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-bold text-white">Ready to Scrape Webtoon Episodes</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                    Paste any official WEBTOON series URL (or enter a Series ID) in the input bar above to automatically fetch chapters, panel images, likes, and ratings.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
                  <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">1</span>
                      Paste Webtoon URL
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Copy the URL from webtoons.com or use a series ID number.
                    </p>
                  </div>

                  <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">2</span>
                      Preview &amp; Filter
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Filter by likes, date, rating, or preview panels full screen.
                    </p>
                  </div>

                  <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                      <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">3</span>
                      Import to Editor
                    </div>
                    <p className="text-[11px] text-neutral-500 font-mono">
                      Directly import scraped images into the timeline video workspace.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* QUICK PREVIEW LIGHTBOX MODAL (Rendered at Application Root Level via Portal) */}
      {previewEpisode &&
        createPortal(
          <EpisodePreviewModal
            episode={previewEpisode}
            onClose={() => setPreviewEpisode(null)}
            onImport={(ep) => {
              // Preview modal uses the shared Episode type; safe to forward
              setPreviewEpisode(null);
              handleEpisodeClick(ep);
            }}
            fetchWithInterceptor={fetchWithInterceptor}
          />,
          document.body
        )}
    </div>
  );
};
