import React, { useState, useRef, useEffect } from "react";
import { createTempProjectId } from "@/shared/utils/workspaceNavigation";
import { createPortal } from "react-dom";
import {
  Search,
  Loader,
  AlertCircle,
  Zap,
  Clock,
  Trash2,
} from "lucide-react";
import { ChapterGrid } from "./ChapterGrid";
import { ChapterControls } from "./ChapterControls";
import { RecentSeriesCard } from "./RecentSeriesCard";
import ChapterWorkspaceTabs from "./ChapterWorkspaceTabs";
import {
  FavoritesManager,
  FavoriteSeries,
  FAVORITES_UPDATED_EVENT,
} from "../utils/FavoritesManager";
import { BatchThumbnailDownloader } from "./BatchThumbnailDownloader";
import { ChapterReaderModal } from "./ChapterReaderModal";
import { ChapterScraperEmptyState } from "./ChapterScraperEmptyState";
import { NotificationType } from "@/features/app_notification";
import { getSeriesEpisodes, separateComicUrl } from "@/api/endpoints/scraper";
import type { Chapter } from "../types/ChapterTypes";
import { makeSafeFilename } from "@/shared/utils/downloadNaming";

interface SeriesMetadata {
  seriesSlug?: string;
  title: string;
  author: string;
  genre: string;
  platform?: string;
  cover_image: string;
  description: string;
  url?: string;
}

interface ChapterScraperProps {
  onChapterSelect?: (chapter: Chapter) => void;
  onEpisodeSelect?: (chapter: Chapter) => void; // alias for backwards compatibility
  onMultipleChaptersSelect?: (chapters: Chapter[]) => void;
  onMultipleEpisodesSelect?: (chapters: Chapter[]) => void; // alias
  addNotification: (message: string, type: NotificationType) => void;
  fetchWithInterceptor: typeof fetch;
  isStandalone?: boolean;
}

const parseLikes = (likesStr?: string): number => {
  if (!likesStr) return 0;
  const clean = likesStr.replace(/,/g, "").trim().toUpperCase();
  const numPart = parseFloat(clean);
  if (isNaN(numPart)) return 0;
  if (clean.endsWith("K")) return numPart * 1000;
  if (clean.endsWith("M")) return numPart * 1000000;
  if (clean.endsWith("B")) return numPart * 1000000000;
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

export const ChapterScraper: React.FC<ChapterScraperProps> = ({
  onChapterSelect,
  onEpisodeSelect,
  onMultipleChaptersSelect,
  onMultipleEpisodesSelect,
  addNotification,
  fetchWithInterceptor,
  isStandalone = false,
}) => {
  const handleSelectCallback = onChapterSelect || onEpisodeSelect;
  const handleMultipleCallback = onMultipleChaptersSelect || onMultipleEpisodesSelect;

  const [urlInput, setUrlInput] = useState("");
  const [titleNoInput, setTitleNoInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(isStandalone);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [seriesMetadata, setSeriesMetadata] = useState<SeriesMetadata | null>(
    null
  );

  const [maxChapters, setMaxChapters] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "rating" | "likes"
  >("latest");
  const [searchQuery, setSearchQuery] = useState("");

  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Tabs & previews
  const [activeTab, setActiveTab] = useState<
    "chapters" | "bookmarks" | "recent"
  >("chapters");
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);

  // Filters
  const [bookmarkedUrls, setBookmarkedUrls] = useState<string[]>([]);
  const [readUrls, setReadUrls] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minLikes, setMinLikes] = useState<number>(0);
  const [readStatusFilter, setReadStatusFilter] = useState<
    "all" | "read" | "unread"
  >("all");
  const [bookmarksOnly, setBookmarksOnly] = useState<boolean>(false);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [startChapterNum, setStartChapterNum] = useState<string>("");
  const [endChapterNum, setEndChapterNum] = useState<string>("");

  // Multi-Select
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    active: boolean;
    title: string;
  }>({ current: 0, total: 0, active: false, title: "" });

  const cancelBatchRef = useRef(false);

  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<FavoriteSeries[]>([]);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  const [customSiteAdded, setCustomSiteAdded] = useState(false);

  useEffect(() => {
    setCustomSiteAdded(false);
  }, [urlInput]);

  useEffect(() => {
    const refreshSuggestions = () => {
      try {
        const recents = FavoritesManager.getRecent();
        const favorites = FavoritesManager.getFavorites();
        const merged =
          activeTab === "recent" ? recents : [...recents, ...favorites];
        const uniqueMap = new Map();
        merged.forEach((item) => {
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
    window.addEventListener("storage", handleFavoritesChanged);

    return () => {
      window.removeEventListener(
        FAVORITES_UPDATED_EVENT,
        handleFavoritesChanged
      );
      window.removeEventListener("storage", handleFavoritesChanged);
    };
  }, [activeTab]);

  useEffect(() => {
    if (!showSuggestions) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target as Node)
      ) {
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
    setReadUrls(FavoritesManager.getReadChapters());
  }, []);

  const scrapeChaptersAPI = async (data: {
    url?: string;
    title_no?: string;
    max_episodes?: number | null;
    sort_by?: string;
    bypass_cache?: boolean;
  }) => {
    const body: any = { ...data };
    if (body.max_episodes === null) {
      delete body.max_episodes;
    }

    return await getSeriesEpisodes(fetchWithInterceptor, body);
  };

  useEffect(() => {
    let result = [...chapters];

    if (sortBy === "oldest") {
      result = result.reverse();
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === "likes") {
      result.sort((a, b) => parseLikes(b.likes) - parseLikes(a.likes));
    }

    if (searchQuery) {
      result = result.filter(
        (ch) =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (minRating > 0) {
      result = result.filter((ch) => (ch.rating || 0) >= minRating);
    }

    if (minLikes > 0) {
      result = result.filter((ch) => parseLikes(ch.likes) >= minLikes);
    }

    if (readStatusFilter === "read") {
      result = result.filter((ch) => readUrls.includes(ch.url));
    } else if (readStatusFilter === "unread") {
      result = result.filter((ch) => !readUrls.includes(ch.url));
    }

    if (bookmarksOnly) {
      result = result.filter((ch) => bookmarkedUrls.includes(ch.url));
    }

    if (fromDate) {
      const from = new Date(fromDate);
      result = result.filter((ch) => {
        const chDate = parseWebtoonDate(ch.date);
        return chDate && chDate >= from;
      });
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((ch) => {
        const chDate = parseWebtoonDate(ch.date);
        return chDate && chDate <= to;
      });
    }

    if (startChapterNum !== "") {
      const start = parseInt(startChapterNum, 10);
      if (!isNaN(start)) {
        result = result.filter((ch) => (ch.chapter_number ?? 0) >= start);
      }
    }
    if (endChapterNum !== "") {
      const end = parseInt(endChapterNum, 10);
      if (!isNaN(end)) {
        result = result.filter((ch) => (ch.chapter_number ?? Infinity) <= end);
      }
    }

    setFilteredChapters(result);
  }, [
    chapters,
    sortBy,
    searchQuery,
    minRating,
    minLikes,
    readStatusFilter,
    bookmarksOnly,
    startChapterNum,
    endChapterNum,
    fromDate,
    toDate,
    readUrls,
    bookmarkedUrls,
  ]);

  const triggerScrape = async (
    url?: string,
    titleNo?: string,
    bypassCache = true
  ) => {
    const activeUrl = url !== undefined ? url : urlInput;
    const activeTitleNo = titleNo !== undefined ? titleNo : titleNoInput;

    if (!activeUrl && !activeTitleNo) {
      setError("Please enter a Comic, Manga, or Manhwa URL");
      addNotification("Please enter a Comic, Manga, or Manhwa URL", "error");
      return;
    }

    setIsLoading(true);
    setError(null);
    setChapters([]);
    setSeriesMetadata(null);
    setSelectedUrls([]);

    let targetSeriesUrl = activeUrl;
    let targetTitleNo = activeTitleNo;

    if (activeUrl && activeUrl.trim()) {
      try {
        const sep = await separateComicUrl(fetchWithInterceptor, activeUrl.trim());
        if (sep && sep.success) {
          if (sep.series_url) {
            targetSeriesUrl = sep.series_url;
          }
          if (sep.title_no && !targetTitleNo) {
            targetTitleNo = sep.title_no;
            setTitleNoInput(sep.title_no);
          }
          if (sep.is_chapter_url) {
            addNotification(
              `Resolved parent series from chapter link (${sep.domain})`,
              "info"
            );
          }
        }
      } catch (e) {
        console.debug("[ChapterScraper] URL separation note:", e);
      }
    }

    try {
      const result = await scrapeChaptersAPI({
        url: targetSeriesUrl || undefined,
        title_no: targetTitleNo || undefined,
        max_episodes: maxChapters,
        sort_by: sortBy,
        bypass_cache: bypassCache,
      });

      if (result.success) {
        const rawChapters = result.chapters || [];
        const fallbackCover = result.cover_image || result.series?.cover_image || "";
        const normalizedChapters = rawChapters.map((ch: any, i: number) => ({
          ...ch,
          cover_image: ch.cover_image || fallbackCover,
          chapter_number: ch.chapter_number ?? ch.number ?? (i + 1),
          number: String(ch.chapter_number ?? ch.number ?? (i + 1)),
          title: ch.title || `Chapter ${ch.chapter_number ?? (i + 1)}`,
          url: ch.url,
          index: ch.index ?? i,
        }));

        setChapters(normalizedChapters);
        const seriesData = result.series || result;
        setSeriesMetadata({
          title: seriesData.title || "Comic Series",
          author: seriesData.author || "",
          genre: seriesData.genre || "General",
          platform: seriesData.platform || "comic",
          cover_image: seriesData.cover_image || fallbackCover,
          description: seriesData.description || "",
          url: seriesData.url || targetSeriesUrl || activeUrl,
        });

        if (result.series && result.title_no) {
          FavoritesManager.addRecent({
            title_no: result.title_no,
            title: result.series.title,
            genre: result.series.genre,
            cover_image: result.series.cover_image,
            timestamp: Date.now(),
            url:
              activeUrl ||
              result.url ||
              `https://www.webtoons.com/en/romance/list?title_no=${result.title_no}`,
          });

          setIsFavorite(FavoritesManager.isFavorite(result.title_no));
        }

        const totalFound = result.total_chapters ?? normalizedChapters.length;
        const cacheNote = result.from_cache ? " (from cache)" : " (fresh)";
        addNotification(
          `Found ${totalFound} chapters!${cacheNote}`,
          "success"
        );
      } else {
        const errorMsg = result.error || "Failed to scrape chapters";
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
    const storedUrl = localStorage.getItem("chapter_scraper_url") || localStorage.getItem("episode_scraper_url");
    const target = paramUrl || storedUrl;

    if (target) {
      setUrlInput(target);
      localStorage.removeItem("chapter_scraper_url");
      localStorage.removeItem("episode_scraper_url");

      setMinRating(0);
      setMinLikes(0);
      setReadStatusFilter("all");
      setBookmarksOnly(false);
      setFromDate("");
      setToDate("");
      setStartChapterNum("");
      setEndChapterNum("");
      setSearchQuery("");
      setSelectedUrls([]);
      setIsMultiSelectMode(false);
      setShowFavorites(false);
      setShowRecent(false);

      if (paramUrl) {
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("url");
        const newSearch = newParams.toString();
        const newUrl =
          window.location.pathname + (newSearch ? "?" + newSearch : "");
        window.history.replaceState(null, "", newUrl);
      }

      triggerScrape(target);
    }
  }, []);

  const handleChapterClick = (chapter: Chapter) => {
    FavoritesManager.markAsRead(chapter.url);
    setReadUrls(FavoritesManager.getReadChapters());

    if (handleSelectCallback) {
      handleSelectCallback(chapter);
      return;
    }

    const temporaryProjectId = createTempProjectId(
      seriesMetadata?.seriesSlug || seriesMetadata?.title || titleNoInput
    );
    localStorage.setItem("auto_import_url", chapter.url);
    const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav(targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
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
      url:
        urlInput ||
        seriesMetadata.url ||
        `https://www.webtoons.com/en/romance/list?title_no=${titleNoInput}`,
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
      addNotification("Chapter bookmarked", "success");
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
    setReadUrls(FavoritesManager.getReadChapters());
    setSelectedUrls([]);
    addNotification(
      `Marked ${selectedUrls.length} chapters as read`,
      "success"
    );
  };

  const handleBatchMarkUnread = () => {
    selectedUrls.forEach((url) => FavoritesManager.markAsUnread(url));
    setReadUrls(FavoritesManager.getReadChapters());
    setSelectedUrls([]);
    addNotification(
      `Marked ${selectedUrls.length} chapters as unread`,
      "success"
    );
  };

  const handleBatchBookmark = () => {
    const allBookmarked = selectedUrls.every((url) =>
      bookmarkedUrls.includes(url)
    );
    if (allBookmarked) {
      selectedUrls.forEach((url) => FavoritesManager.removeBookmark(url));
      addNotification(`Removed ${selectedUrls.length} bookmarks`, "info");
    } else {
      selectedUrls.forEach((url) => FavoritesManager.addBookmark(url));
      addNotification(`Bookmarked ${selectedUrls.length} chapters`, "success");
    }
    setBookmarkedUrls(FavoritesManager.getBookmarks());
    setSelectedUrls([]);
  };

  const handleBatchScrape = async () => {
    if (selectedUrls.length === 0) return;

    selectedUrls.forEach((url) => FavoritesManager.markAsRead(url));
    setReadUrls(FavoritesManager.getReadChapters());

    const selectedChObjects = chapters.filter((ch) =>
      selectedUrls.includes(ch.url)
    );
    const fallbackList: Chapter[] = selectedUrls.map((url, idx) => ({
      url,
      number: `Chapter ${idx + 1}`,
      title: "",
      date: "",
      cover_image: "",
      index: idx,
    }));
    const finalChapters =
      selectedChObjects.length > 0 ? selectedChObjects : fallbackList;

    if (handleMultipleCallback) {
      handleMultipleCallback(finalChapters);
      return;
    }

    const temporaryProjectId = createTempProjectId(
      seriesMetadata?.seriesSlug || seriesMetadata?.title || titleNoInput
    );

    localStorage.setItem("auto_import_batch", JSON.stringify(finalChapters));
    localStorage.setItem("auto_import_url", finalChapters[0].url);
    const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav(targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handleExportCSV = () => {
    if (filteredChapters.length === 0) return;
    const headers = [
      "Chapter Number",
      "Title",
      "Date",
      "Rating",
      "Likes",
      "URL",
    ];
    const rows = filteredChapters.map((ch) => [
      `"${ch.number.replace(/"/g, '""')}"`,
      `"${ch.title.replace(/"/g, '""')}"`,
      `"${ch.date.replace(/"/g, '""')}"`,
      ch.rating ?? "",
      ch.likes ?? "",
      `"${ch.url}"`,
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeSeries = makeSafeFilename(
      seriesMetadata?.title,
      "Comic_Series"
    );
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${safeSeries}_chapters_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (filteredChapters.length === 0) return;
    const jsonContent = JSON.stringify(filteredChapters, null, 2);
    const blob = new Blob([jsonContent], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeSeries = makeSafeFilename(
      seriesMetadata?.title,
      "Comic_Series"
    );
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${safeSeries}_chapters_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClearFilters = () => {
    setMinRating(0);
    setMinLikes(0);
    setReadStatusFilter("all");
    setBookmarksOnly(false);
    setFromDate("");
    setToDate("");
    setStartChapterNum("");
    setEndChapterNum("");
  };

  return (
    <div className="w-full space-y-6">
      <form
        aria-label="Chapter scraper input"
        onSubmit={(event) => {
          event.preventDefault();
          handleScrape();
        }}
        className="grid grid-cols-1 lg:grid-cols-[1fr_180px_auto] gap-3 p-4 bg-neutral-900/40 border border-neutral-800/80 rounded-2xl"
      >
        <label className="relative">
          <span className="sr-only">Comic series or chapter URL</span>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
            size={16}
          />
          <input
            type="url"
            value={urlInput}
            onChange={(event) => {
              const nextUrl = event.target.value;
              setUrlInput(nextUrl);
              try {
                const parsedUrl = new URL(nextUrl);
                const detectedTitleNo = parsedUrl.searchParams.get("title_no");
                if (detectedTitleNo) setTitleNoInput(detectedTitleNo);
              } catch {}
            }}
            placeholder="Paste a comic series or chapter URL"
            aria-label="Comic series or chapter URL"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-955 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-neutral-600 focus:border-purple-500 focus:outline-none"
          />
        </label>
        <label>
          <span className="sr-only">Series ID</span>
          <input
            type="text"
            value={titleNoInput}
            onChange={(event) => setTitleNoInput(event.target.value)}
            placeholder="Series ID"
            aria-label="Series ID"
            className="w-full rounded-xl border border-neutral-800 bg-neutral-955 px-3 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:border-purple-500 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={isLoading || (!urlInput.trim() && !titleNoInput.trim())}
          className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Zap className="h-4 w-4" />
          )}
          {isLoading ? "Loading..." : "Load Chapters"}
        </button>
      </form>

      {/* ERROR DISPLAY */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/35 rounded-2xl flex items-center gap-3 text-red-400 text-sm animate-in shake duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <ChapterWorkspaceTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        filteredChapterCount={filteredChapters.length}
        setBookmarksOnly={setBookmarksOnly}
        setShowFavorites={setShowFavorites}
        setShowRecent={setShowRecent}
        isLoading={isLoading}
      />

      {/* ACTIVE WORKSPACE CONTAINER */}
      {chapters.length > 0 && activeTab !== "recent" ? (
        <div id="chapter-scraper-view" className="space-y-6">
          <div className="space-y-6">
            <ChapterControls
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
              startChapterNum={startChapterNum}
              onStartChapterChange={setStartChapterNum}
              endChapterNum={endChapterNum}
              onEndChapterChange={setEndChapterNum}
              onClearFilters={handleClearFilters}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />

            {/* Multi-Select Floating Drawer */}
            {isMultiSelectMode && selectedUrls.length > 0 && (
              <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-2 duration-300">
                <div className="text-xs font-medium text-purple-300">
                  Selected{" "}
                  <span className="font-bold text-white">
                    {selectedUrls.length}
                  </span>{" "}
                  chapters
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
                    <p className="text-sm font-bold text-white">
                      {batchProgress.title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Processing {batchProgress.current} of{" "}
                      {batchProgress.total}
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
                    style={{
                      width: `${
                        (batchProgress.current / batchProgress.total) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Chapter Grid View */}
            {filteredChapters.length > 0 ? (
              <div className="bg-neutral-955 border border-neutral-900/60 rounded-3xl p-2 sm:p-4">
                <ChapterGrid
                  chapters={filteredChapters}
                  onChapterClick={handleChapterClick}
                  onPreviewClick={setPreviewChapter}
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
                <p className="text-sm font-semibold text-neutral-450">
                  No chapters matched your search criteria.
                </p>
                <p className="text-xs text-neutral-600">
                  Try adjusting your filters, date ranges, or search query.
                </p>
              </div>
            )}

            {/* Zip Downloader Footer Tool */}
            {seriesMetadata && filteredChapters.length > 0 && (
              <div className="p-4 bg-neutral-900/20 border border-neutral-855/80 rounded-2xl">
                <BatchThumbnailDownloader
                  chapters={filteredChapters}
                  seriesTitle={seriesMetadata.title}
                />
              </div>
            )}
          </div>
        </div>
      ) : isLoading ? (
        <ChapterScraperEmptyState urlInput={urlInput} isLoading={true} />
      ) : (
        <div
          id="chapter-scraper-view"
          className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {activeTab !== "recent" && (
            <ChapterControls
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
              startChapterNum={startChapterNum}
              onStartChapterChange={setStartChapterNum}
              endChapterNum={endChapterNum}
              onEndChapterChange={setEndChapterNum}
              onClearFilters={handleClearFilters}
              onExportCSV={handleExportCSV}
              onExportJSON={handleExportJSON}
            />
          )}

          {
            <>
              {activeTab === "recent" && suggestions.length > 0 ? (
                <div className="bg-gradient-to-b from-neutral-900/60 to-neutral-950/40 rounded-3xl border border-neutral-800/80 p-6 sm:p-8 backdrop-blur-md space-y-6">
                  <div className="flex items-center justify-between border-b border-neutral-800/40 pb-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400 rounded-xl border border-purple-500/30 shadow-lg shadow-purple-950/20">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-white tracking-wide">
                            Recently Browsed Series
                          </h3>
                          <span className="px-2.5 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30 font-mono">
                            {suggestions.length} series
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 font-mono">
                          Click a card to load chapters or manage your recent
                          history
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          window.confirm("Clear all recent series history?")
                        ) {
                          FavoritesManager.clearRecent();
                          window.location.reload();
                        }
                      }}
                      className="px-3 py-2 text-xs font-bold rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-all flex items-center gap-1.5"
                      title="Clear recent history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {suggestions.map((series) => (
                      <RecentSeriesCard
                        key={series.title_no}
                        series={series}
                        onSelect={(selectedSeries) => {
                          setActiveTab("chapters");
                          setBookmarksOnly(false);
                          setShowFavorites(false);
                          setShowRecent(false);
                          if (selectedSeries.url)
                            setUrlInput(selectedSeries.url);
                          setTitleNoInput(selectedSeries.title_no);
                          triggerScrape(
                            selectedSeries.url,
                            selectedSeries.title_no
                          );
                        }}
                        onRemove={() => {
                          setTimeout(() => window.location.reload(), 200);
                        }}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-neutral-800/40">
                    <div className="bg-neutral-950/40 rounded-xl p-3 text-center border border-neutral-800/20">
                      <div className="text-xs text-neutral-500 font-mono mb-1">
                        Total Bookmarked
                      </div>
                      <div className="text-lg font-bold text-purple-400">
                        {FavoritesManager.getBookmarks().length}
                      </div>
                    </div>
                    <div className="bg-neutral-950/40 rounded-xl p-3 text-center border border-neutral-800/20">
                      <div className="text-xs text-neutral-500 font-mono mb-1">
                        Recently Added
                      </div>
                      <div className="text-lg font-bold text-amber-400">
                        {suggestions.length}
                      </div>
                    </div>
                    <div className="bg-neutral-950/40 rounded-xl p-3 text-center border border-neutral-800/20">
                      <div className="text-xs text-neutral-500 font-mono mb-1">
                        Total Favorites
                      </div>
                      <div className="text-lg font-bold text-pink-400">
                        {FavoritesManager.getFavorites().length}
                      </div>
                    </div>
                    <div className="bg-neutral-950/40 rounded-xl p-3 text-center border border-neutral-800/20">
                      <div className="text-xs text-neutral-500 font-mono mb-1">
                        Storage Used
                      </div>
                      <div className="text-lg font-bold text-sky-400">
                        {suggestions.length} series
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 text-center space-y-6 backdrop-blur-md">
                  <div className="w-14 h-14 rounded-3xl bg-purple-600/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-2">
                    <h3 className="text-lg font-bold text-white">
                      Ready to Scrape Comic Chapters
                    </h3>
                    <p className="text-xs text-neutral-400 leading-relaxed font-mono">
                      Paste any comic or manga series URL in the input bar above
                      to automatically fetch chapters, panel images, and ratings.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
                    <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">
                          1
                        </span>
                        Paste Comic URL
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Copy the URL from any supported comic site.
                      </p>
                    </div>

                    <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">
                          2
                        </span>
                        Preview &amp; Filter
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Filter chapters by rating, date, or read panels full screen.
                      </p>
                    </div>

                    <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400 font-bold text-xs font-mono">
                        <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">
                          3
                        </span>
                        Import to Editor
                      </div>
                      <p className="text-[11px] text-neutral-500 font-mono">
                        Directly import scraped chapter panels into the timeline video
                        workspace.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          }
        </div>
      )}

      {/* QUICK PREVIEW LIGHTBOX MODAL */}
      {previewChapter &&
        createPortal(
          <ChapterReaderModal
            chapter={previewChapter}
            onClose={() => setPreviewChapter(null)}
            onImport={(ch) => {
              setPreviewChapter(null);
              handleChapterClick(ch);
            }}
            fetchWithInterceptor={fetchWithInterceptor}
          />,
          document.body
        )}
    </div>
  );
};

export const EpisodeScraper = ChapterScraper;
export default ChapterScraper;
