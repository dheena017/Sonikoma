import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Filter,
  Grid,
  List,
  RotateCw,
  Clock,
  Sparkles,
  Loader,
  AlertCircle,
  Zap,
  Bookmark,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  BookOpen,
  FolderOpen,
  Star,
  Film,
  Volume2,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  X,
  Edit3,
  Flame,
  Globe,
  Tag,
  Plus,
} from "lucide-react";

import { ChapterCard } from "./ChapterCard";
import {
  FavoritesManager,
  FavoriteSeries,
  FAVORITES_UPDATED_EVENT,
} from "../utils/FavoritesManager";
import { BatchThumbnailDownloader } from "./BatchThumbnailDownloader";
import { ChapterReaderModal } from "./ChapterReaderModal";
import { ChapterScraperEmptyState } from "./ChapterScraperEmptyState";
import ScraperConnectionErrorCard from "./ScraperConnectionErrorCard";
import type { NotificationType } from "@/features/app_notification";
import { getSeriesEpisodes, separateComicUrl } from "@/api/endpoints/scraper";
import type { Chapter } from "../types/ChapterTypes";
import { makeSafeFilename } from "@/shared/utils/downloadNaming";
import { getProxiedImageUrl, getSourceName } from "@/shared/utils/imageProxy";
import { ChapterScraperSkeleton } from "@/shared/ui/loading";
import RouteLoadingFallback from "@/components/feedback/RouteLoadingFallback";

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
  initialSeriesName?: string;
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

const createTempProjectId = (slug?: string) => {
  const cleanSlug = (slug || "comic")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `temp_${cleanSlug}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 6)}`;
};

export const ChapterScraper: React.FC<ChapterScraperProps> = ({
  onChapterSelect,
  onEpisodeSelect,
  onMultipleChaptersSelect,
  onMultipleEpisodesSelect,
  addNotification,
  fetchWithInterceptor,
  isStandalone = false,
  initialSeriesName,
}) => {
  const handleSelectCallback = onChapterSelect || onEpisodeSelect;
  const handleMultipleCallback =
    onMultipleChaptersSelect || onMultipleEpisodesSelect;

  // Form Inputs
  const [urlInput, setUrlInput] = useState("");
  const [titleNoInput, setTitleNoInput] = useState("");
  const [isUrlBarOpen, setIsUrlBarOpen] = useState(false);

  // Scraped Data State
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
  const [seriesMetadata, setSeriesMetadata] = useState<SeriesMetadata | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active View & Filters
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<
    "latest" | "oldest" | "rating" | "likes"
  >("latest");
  const [searchQuery, setSearchQuery] = useState("");
  const [readStatusFilter, setReadStatusFilter] = useState<
    "all" | "unread" | "read"
  >("all");
  const [bookmarksOnly, setBookmarksOnly] = useState(false);
  const [minRating, setMinRating] = useState<number>(0);
  const [minLikes, setMinLikes] = useState<number>(0);
  const [maxChapters, setMaxChapters] = useState<number | null>(null);

  // Multi-select & Batch Actions
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Favorites & Read History
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookmarkedUrls, setBookmarkedUrls] = useState<string[]>([]);
  const [readUrls, setReadUrls] = useState<string[]>([]);

  // Modals & Lightboxes
  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Suggestions
  const [suggestions, setSuggestions] = useState<FavoriteSeries[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);

  // Aggregated series metrics
  const totalPanels = useMemo(() => {
    return chapters.length * 8; // Estimate average 8 panels per chapter
  }, [chapters]);

  const estimatedRuntimeMinutes = useMemo(() => {
    return Math.max(1, Math.round((totalPanels * 4) / 60));
  }, [totalPanels]);

  const readChaptersCount = useMemo(() => {
    return chapters.filter((c) => readUrls.includes(c.url)).length;
  }, [chapters, readUrls]);

  const unreadChaptersCount = useMemo(() => {
    return chapters.length - readChaptersCount;
  }, [chapters, readChaptersCount]);

  const avgRating = useMemo(() => {
    const rated = chapters.filter(
      (c) => c.rating !== undefined && c.rating !== null && c.rating > 0
    );
    if (rated.length === 0) return "9.6";
    const sum = rated.reduce((acc, c) => acc + (c.rating || 0), 0);
    return (sum / rated.length).toFixed(1);
  }, [chapters]);

  const isErrorSeries = useMemo(() => {
    if (error) return true;
    if (!seriesMetadata) return false;
    const title = (seriesMetadata.title || "").toLowerCase();
    return (
      title.includes("connect error") ||
      title.includes("error ::") ||
      title.includes("404 not found") ||
      title.includes("page not found") ||
      title.includes("access denied") ||
      (chapters.length === 0 && !isLoading)
    );
  }, [error, seriesMetadata, chapters.length, isLoading]);

  // Load suggestions from FavoritesManager
  useEffect(() => {
    const refreshSuggestions = () => {
      try {
        const recents = FavoritesManager.getRecent();
        const favorites = FavoritesManager.getFavorites();
        const merged = [...recents, ...favorites];
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
    window.addEventListener(FAVORITES_UPDATED_EVENT, refreshSuggestions);
    window.addEventListener("storage", refreshSuggestions);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refreshSuggestions);
      window.removeEventListener("storage", refreshSuggestions);
    };
  }, []);

  useEffect(() => {
    setBookmarkedUrls(FavoritesManager.getBookmarks());
    setReadUrls(FavoritesManager.getReadChapters());

    // Auto-discover if initialSeriesName or ?url= query is present
    const searchParams = new URLSearchParams(window.location.search);
    const queryUrl = searchParams.get("url") || searchParams.get("target");
    if (queryUrl) {
      setUrlInput(queryUrl);
      triggerScrape(queryUrl, undefined, false);
      return;
    }

    const isReservedRoute =
      initialSeriesName === "chapters" ||
      initialSeriesName === "chapter-scraper" ||
      initialSeriesName === "episode-scraper" ||
      initialSeriesName === "editor" ||
      initialSeriesName === "audio-settings";

    if (initialSeriesName && !isReservedRoute) {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const allItems = [...recents, ...favorites];

      const match = allItems.find((item) => {
        const titleSlug = (item.title || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const urlSlug = (item.url || "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const targetSlug = initialSeriesName.toLowerCase();
        return (
          titleSlug.includes(targetSlug) ||
          targetSlug.includes(titleSlug) ||
          urlSlug.includes(targetSlug) ||
          item.title_no === initialSeriesName
        );
      });

      if (match && match.url) {
        setUrlInput(match.url);
        triggerScrape(match.url, match.title_no, false);
      } else {
        triggerScrape(initialSeriesName, undefined, false);
      }
    }
  }, [initialSeriesName]);

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

  // Filter & sort chapters logic
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
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (ch) =>
          ch.title.toLowerCase().includes(q) ||
          ch.number.toLowerCase().includes(q)
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

    setFilteredChapters(result);
  }, [
    chapters,
    sortBy,
    searchQuery,
    minRating,
    minLikes,
    readStatusFilter,
    bookmarksOnly,
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

    let targetSeriesUrl = activeUrl;
    let targetTitleNo = activeTitleNo;

    if (activeUrl && activeUrl.trim()) {
      try {
        const sep = await separateComicUrl(
          fetchWithInterceptor,
          activeUrl.trim()
        );
        if (sep && sep.success) {
          if (sep.series_url) {
            targetSeriesUrl = sep.series_url;
          }
          if (sep.title_no && !targetTitleNo) {
            targetTitleNo = sep.title_no;
            setTitleNoInput(sep.title_no);
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
        const fallbackCover =
          result.cover_image || result.series?.cover_image || "";
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
        const resolvedTitle = seriesData.title || result.title || "Comic Series";

        setSeriesMetadata({
          title: resolvedTitle,
          author: seriesData.author || "",
          genre: seriesData.genre || "General",
          platform: seriesData.platform || "comic",
          cover_image: seriesData.cover_image || fallbackCover,
          description: seriesData.description || "",
          url: seriesData.url || targetSeriesUrl || activeUrl,
        });

        // Add to recents
        if (result.title_no || activeUrl) {
          FavoritesManager.addRecent({
            title_no: result.title_no || "comic",
            title: resolvedTitle,
            genre: seriesData.genre || "General",
            cover_image: seriesData.cover_image || fallbackCover,
            timestamp: Date.now(),
            url: activeUrl || result.url || targetSeriesUrl,
          });

          setIsFavorite(
            FavoritesManager.isFavorite(result.title_no || resolvedTitle)
          );
        }

        // Dynamically update browser URL to /scraper/{series-slug}
        try {
          const slug = (
            result.series_slug ||
            resolvedTitle
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-+|-+$/g, "")
          ) || "";

          if (slug) {
            const newPath = `/scraper/${encodeURIComponent(slug)}`;
            if (
              window.location.pathname !== newPath &&
              !window.location.pathname.startsWith("/scraper/editor")
            ) {
              window.history.replaceState(null, "", newPath);
            }
          }
        } catch (e) {
          console.debug("[ChapterScraper] Route sync notice:", e);
        }

        const totalFound = result.total_chapters ?? normalizedChapters.length;
        const cacheNote = result.from_cache ? " (from cache)" : " (fresh)";
        addNotification(`Found ${totalFound} chapters!${cacheNote}`, "success");
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

  // Initial load from URL params, stored URLs, or route /scraper/{seriesName}
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paramUrl = params.get("url");
    const storedUrl =
      localStorage.getItem("chapter_scraper_url") ||
      localStorage.getItem("episode_scraper_url");
    let target = paramUrl || storedUrl;

    if (!target && initialSeriesName) {
      if (
        initialSeriesName.startsWith("http://") ||
        initialSeriesName.startsWith("https://")
      ) {
        target = initialSeriesName;
      } else {
        try {
          const recents = FavoritesManager.getRecent();
          const favorites = FavoritesManager.getFavorites();
          const allItems = [...recents, ...favorites];
          const cleanInit = initialSeriesName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-");
          const found = allItems.find((item) => {
            const itemSlug = (item.title || "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-");
            return (
              itemSlug === cleanInit ||
              item.title_no === initialSeriesName ||
              (item.url &&
                item.url
                  .toLowerCase()
                  .includes(initialSeriesName.toLowerCase()))
            );
          });
          if (found && found.url) {
            target = found.url;
          } else if (/^\d+$/.test(initialSeriesName)) {
            setTitleNoInput(initialSeriesName);
            triggerScrape(undefined, initialSeriesName);
            return;
          } else if (initialSeriesName && initialSeriesName !== "chapters") {
            target = initialSeriesName;
          }
        } catch (e) {
          console.debug("[ChapterScraper] Favorites lookup:", e);
          if (initialSeriesName && initialSeriesName !== "chapters") {
            target = initialSeriesName;
          }
        }
      }
    }

    if (target) {
      setUrlInput(target);
      localStorage.removeItem("chapter_scraper_url");
      localStorage.removeItem("episode_scraper_url");

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

  const handleFavoriteToggle = () => {
    if (!seriesMetadata) return;
    const key = titleNoInput || seriesMetadata.title;
    if (isFavorite) {
      FavoritesManager.removeFavorite(key);
      setIsFavorite(false);
      addNotification(`Removed from favorites`, "info");
    } else {
      FavoritesManager.addFavorite({
        title_no: titleNoInput || "comic",
        title: seriesMetadata.title,
        genre: seriesMetadata.genre,
        cover_image: seriesMetadata.cover_image,
        timestamp: Date.now(),
        url: urlInput || seriesMetadata.url || "",
      });
      setIsFavorite(true);
      addNotification(`Added "${seriesMetadata.title}" to favorites`, "success");
    }
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

  const selectAllChapters = () => {
    if (selectedUrls.length === filteredChapters.length) {
      setSelectedUrls([]);
    } else {
      setSelectedUrls(filteredChapters.map((c) => c.url));
    }
  };

  const handleBatchScrape = () => {
    if (selectedUrls.length === 0) return;
    const selected = chapters.filter((c) => selectedUrls.includes(c.url));
    if (handleMultipleCallback) {
      handleMultipleCallback(selected);
      return;
    }

    const temporaryProjectId = createTempProjectId(
      seriesMetadata?.seriesSlug || seriesMetadata?.title || titleNoInput
    );
    localStorage.setItem("auto_import_batch", JSON.stringify(selected));
    localStorage.setItem("auto_import_url", selected[0]?.url || "");
    const targetPath = `/scraper/editor?id=${temporaryProjectId}`;
    const nav = (window as any).navigateTo;
    if (typeof nav === "function") {
      nav(targetPath);
    } else {
      window.history.pushState({}, "", targetPath);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const handleExportJSON = () => {
    if (chapters.length === 0) return;
    const jsonContent = JSON.stringify(
      {
        series: seriesMetadata,
        chapters: chapters,
      },
      null,
      2
    );
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
    link.download = `${safeSeries}_full_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification("Exported series metadata JSON", "success");
  };

  return (
    <div className="w-full flex-1 flex flex-col text-neutral-100 animate-fade-in relative z-10 py-2 max-w-7xl mx-auto selection:bg-[#2A2A2A] space-y-8">
      {/* ── TOP PERSISTENT NAV: New Chapter button (when series is loaded) ── */}
      {seriesMetadata && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const nav = (window as any).navigateTo;
              if (typeof nav === "function") {
                nav("/scraper");
              } else {
                window.history.pushState({}, "", "/scraper");
                window.dispatchEvent(new Event("popstate"));
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neutral-900/80 border border-neutral-700/60 hover:border-[#3B82F6]/50 text-neutral-300 hover:text-white text-xs font-bold font-mono transition-all cursor-pointer group active:scale-95 backdrop-blur-sm"
          >
            <Plus className="w-3.5 h-3.5 text-[#3B82F6] group-hover:rotate-90 transition-transform duration-200" />
            New Chapter
          </button>
        </div>
      )}

      {/* ── COLLAPSIBLE SEARCH & URL INPUT TOOLBAR (WHEN NO SERIES OR TOGGLED) ── */}
      {(isUrlBarOpen || !seriesMetadata) && (
        <form
          aria-label="Chapter scraper input"
          onSubmit={(e) => {
            e.preventDefault();
            triggerScrape();
          }}
          className="grid grid-cols-1 lg:grid-cols-[1fr_180px_auto] gap-3 p-5 bg-neutral-900/80 border border-[#3B82F6]/20 rounded-3xl backdrop-blur-xl shadow-2xl animate-in fade-in duration-200"
        >
          <div className="relative" ref={suggestionsContainerRef}>
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
              size={17}
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Paste any comic, manga, or manhwa series URL (e.g. Webtoons, FlameComics, Toonily...)"
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-955/90 py-3 pl-10 pr-4 text-sm text-white placeholder:text-neutral-500 focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/50 font-mono transition-all"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl z-50 overflow-hidden py-2">
                <div className="px-3 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                  Recent &amp; Favorite Series
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUrlInput(item.url || "");
                      setShowSuggestions(false);
                      triggerScrape(item.url);
                    }}
                    className="w-full px-3.5 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-[#2A2A2A] flex items-center justify-between transition-colors font-mono cursor-pointer"
                  >
                    <span className="truncate font-semibold">{item.title}</span>
                    <span className="text-[10px] text-[#3B82F6]/80 shrink-0 ml-2">
                      {item.genre || "Comic"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <input
              type="text"
              value={titleNoInput}
              onChange={(e) => setTitleNoInput(e.target.value)}
              placeholder="Series ID (Optional)"
              className="w-full rounded-2xl border border-neutral-800 bg-neutral-955/90 px-3.5 py-3 text-sm text-white placeholder:text-neutral-500 focus:border-[#3B82F6] focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (!urlInput.trim() && !titleNoInput.trim())}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 px-6 py-3 text-sm font-extrabold text-white transition-all shadow-lg shadow-black/50 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer active:scale-95 border border-[#60A5FA]/30"
          >
            {isLoading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4 text-amber-300" />
            )}
            <span>{isLoading ? "Crawling..." : "Fetch Chapters"}</span>
          </button>
        </form>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-950/30 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-300 text-sm animate-in shake duration-300">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
          <p className="font-mono text-xs flex-1">{error}</p>
          {(urlInput || titleNoInput) && (
            <button
              type="button"
              onClick={() => { setError(null); triggerScrape(urlInput || undefined, titleNoInput || undefined, true); }}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-800/60 hover:bg-red-700/60 border border-red-500/40 text-red-200 hover:text-white text-xs font-bold font-mono transition-all cursor-pointer"
            >
              <RotateCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── SKELETON LOADING STATE (shown while fetching series/chapter data from backend) ── */}
      {isLoading && <ChapterScraperSkeleton />}

      {/* ── ERROR STATE: Scraper Connection Error Card ── */}
      {!isLoading && isErrorSeries && (
        <ScraperConnectionErrorCard
          errorMessage={
            error ||
            (seriesMetadata?.title?.toLowerCase().includes("connect error")
              ? "The source server returned a connection error. The requested series could not be found or was blocked."
              : "Unable to retrieve chapters for this series URL.")
          }
          targetUrl={urlInput || titleNoInput || initialSeriesName}
          onRetry={(newUrl) => {
            setError(null);
            setSeriesMetadata(null);
            setChapters([]);
            if (newUrl) setUrlInput(newUrl);
            triggerScrape(newUrl || urlInput || undefined, titleNoInput || undefined, true);
          }}
        />
      )}

      {/* ── 1. AMBIENT GLASSMORPHIC HERO BANNER (MATCHING SERIES DETAILS PAGE) ── */}
      {!isLoading && !isErrorSeries && seriesMetadata && (
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-neutral-900/80 backdrop-blur-2xl shadow-2xl p-6 md:p-8">
          {/* Cover Background Blur Glow */}
          {seriesMetadata.cover_image && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl scale-125 pointer-events-none"
              style={{
                backgroundImage: `url(${getProxiedImageUrl(
                  seriesMetadata.cover_image,
                  seriesMetadata.url
                )})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start">
            {/* Cover Poster */}
            <div className="w-48 h-64 md:w-56 md:h-76 shrink-0 rounded-2xl overflow-hidden border border-white/15 bg-neutral-950 shadow-2xl relative group">
              {seriesMetadata.cover_image ? (
                <img
                  src={getProxiedImageUrl(
                    seriesMetadata.cover_image,
                    seriesMetadata.url
                  )}
                  alt={seriesMetadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#2A2A2A] via-neutral-900 to-neutral-955">
                  <FolderOpen className="w-12 h-12 text-[#3B82F6]/50" />
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">
                    No Cover
                  </span>
                </div>
              )}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-extrabold font-mono text-[#60A5FA] uppercase tracking-wider">
                {seriesMetadata.platform
                  ? seriesMetadata.platform.toUpperCase()
                  : "WEBTOON"}
              </div>
            </div>

            {/* Series Meta Info & Actions */}
            <div className="flex flex-col gap-4 flex-1 min-w-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-xs font-bold font-mono">
                    {seriesMetadata.genre || "Comic"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 border border-neutral-750 text-neutral-300 text-xs font-mono">
                    By {seriesMetadata.author || "Unknown Author"}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white line-clamp-2 font-sans">
                  {seriesMetadata.title}
                </h1>

                {seriesMetadata.description && (
                  <p className="text-neutral-300 text-sm md:text-base leading-relaxed max-w-3xl line-clamp-3 font-sans opacity-90">
                    {seriesMetadata.description}
                  </p>
                )}
              </div>

              {/* Metadata Chips Row */}
              <div className="flex flex-wrap gap-3 items-center pt-2">
                <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                  <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>{chapters.length} Chapters</span>
                </div>

                <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>{totalPanels} Sliced Panels</span>
                </div>

                <div className="flex items-center gap-2 bg-neutral-955/80 border border-white/10 px-3.5 py-1.5 rounded-xl text-xs font-bold font-mono text-neutral-200">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>~{estimatedRuntimeMinutes} Min Video</span>
                </div>

                <div className="flex items-center gap-2 text-neutral-400 text-xs font-mono ml-auto">
                  <span>
                    Updated: {new Date().toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>

              {/* Hero Quick Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => triggerScrape(undefined, undefined, true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-black/50 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-[#60A5FA]/30"
                >
                  <Plus className="h-4 w-4" />
                  <span>Fetch New Chapters</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-[#3B82F6]/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <Film className="h-4 w-4 text-[#3B82F6]" />
                  <span>Export Full Series</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (chapters.length > 0) {
                      setPreviewChapter(chapters[0]);
                    }
                  }}
                  className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-[#3B82F6]/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <BookOpen className="h-4 w-4 text-emerald-400" />
                  <span>Read Series</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const nav = (window as any).navigateTo;
                    if (typeof nav === "function") nav("/creative-suite/ai-voice");
                  }}
                  className="flex items-center gap-2 bg-neutral-955 border border-neutral-750 hover:border-[#3B82F6]/40 text-neutral-200 hover:text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer active:scale-95"
                >
                  <Volume2 className="h-4 w-4 text-amber-400" />
                  <span>Audio Studio</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. DEEP SERIES ANALYTICS DASHBOARD (4 GLASS CARDS) ── */}
      {seriesMetadata && chapters.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4 shadow-lg">
            <div className="p-3 rounded-xl bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/20 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-sans">
                {chapters.length}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                Total Chapters ({readChaptersCount} Ready · {unreadChaptersCount}{" "}
                Draft)
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4 shadow-lg">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-sans">
                {totalPanels}
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                Comic Panels Extracted
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4 shadow-lg">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-white font-sans">
                ~{estimatedRuntimeMinutes}m
              </div>
              <div className="text-xs text-neutral-400 font-mono">
                Estimated Reel Duration
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-neutral-900/70 border border-neutral-800 flex items-center gap-4 shadow-lg">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-[#2F2F2F] shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="w-full">
              <div className="flex justify-between items-center text-xs font-mono text-neutral-300 mb-1">
                <span>Health Score</span>
                <span className="font-bold text-indigo-400">100%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full w-full rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. CHAPTERS SECTION HEADER & FILTER CONTROLS ── */}
      {chapters.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Chapters
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#60A5FA] text-xs font-bold font-mono">
                {filteredChapters.length} of {chapters.length}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search Chapter */}
              <div className="relative min-w-[220px]">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  size={14}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search chapter..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 focus:border-[#3B82F6] focus:outline-none font-mono"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setReadStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    readStatusFilter === "all"
                      ? "bg-[#2A2A2A] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  ALL
                </button>
                <button
                  type="button"
                  onClick={() => setReadStatusFilter("unread")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    readStatusFilter === "unread"
                      ? "bg-[#2A2A2A] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  DRAFT
                </button>
                <button
                  type="button"
                  onClick={() => setReadStatusFilter("read")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    readStatusFilter === "read"
                      ? "bg-[#2A2A2A] text-white shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  READY
                </button>
              </div>

              {/* Sort Order Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#3B82F6] cursor-pointer"
              >
                <option value="latest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="rating">Top Rated</option>
                <option value="likes">Most Likes</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-neutral-800 text-[#3B82F6] shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <Grid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-neutral-800 text-[#3B82F6] shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>

              {/* Multi-Select Toggle */}
              <button
                type="button"
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode);
                  setSelectedUrls([]);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  isMultiSelectMode
                    ? "bg-[#2A2A2A] border-[#3B82F6] text-white shadow-md shadow-black/50"
                    : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
                }`}
              >
                <SlidersHorizontal size={13} />
                <span>Multi-Select</span>
              </button>
            </div>
          </div>

          {/* Multi-Select Floating Action Bar */}
          {isMultiSelectMode && (
            <div className="p-4 bg-[#2A2A2A] border border-[#3B82F6]/30 rounded-2xl flex flex-wrap gap-4 items-center justify-between animate-in slide-in-from-bottom-2 duration-300 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3 text-xs font-mono">
                <button
                  type="button"
                  onClick={selectAllChapters}
                  className="text-[#60A5FA] hover:text-white font-bold underline cursor-pointer"
                >
                  {selectedUrls.length === filteredChapters.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <span className="text-neutral-400">
                  Selected{" "}
                  <strong className="text-white">{selectedUrls.length}</strong>{" "}
                  of {filteredChapters.length} chapters
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={selectedUrls.length === 0}
                  onClick={handleBatchScrape}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shadow-md shadow-black/50"
                >
                  <Zap size={13} />
                  <span>Import Batch ({selectedUrls.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* ── 4. CHAPTERS GRID VIEW ── */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {filteredChapters.map((chapter) => (
                <ChapterCard
                  key={chapter.url}
                  chapter={chapter}
                  onClick={handleChapterClick}
                  onPreviewClick={(ch) => setPreviewChapter(ch)}
                  onBookmark={handleBookmarkToggle}
                  isBookmarked={bookmarkedUrls.includes(chapter.url)}
                  isRead={readUrls.includes(chapter.url)}
                  isMultiSelectMode={isMultiSelectMode}
                  isSelected={selectedUrls.includes(chapter.url)}
                  onToggleSelect={handleToggleSelect}
                />
              ))}
            </div>
          ) : (
            /* ── 5. CHAPTERS LIST VIEW ── */
            <div className="space-y-2">
              {filteredChapters.map((chapter, idx) => (
                <div
                  key={chapter.url}
                  onClick={() => handleChapterClick(chapter)}
                  className="flex items-center justify-between p-3.5 bg-neutral-900/60 hover:bg-neutral-850/80 border border-neutral-800/80 hover:border-[#3B82F6]/40 rounded-2xl transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-12 rounded-xl overflow-hidden bg-neutral-950 shrink-0 border border-white/10 relative">
                      <img
                        src={getProxiedImageUrl(
                          chapter.cover_image || seriesMetadata?.cover_image,
                          chapter.url
                        )}
                        alt={chapter.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#93C5FD] transition-colors truncate font-sans">
                        {chapter.title || `Chapter ${chapter.number || idx + 1}`}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-neutral-400 font-mono mt-0.5">
                        <span className="text-[#3B82F6] font-bold">
                          CH. {chapter.number || idx + 1}
                        </span>
                        <span>•</span>
                        <span>{chapter.date || "Available"}</span>
                        {chapter.rating && (
                          <>
                            <span>•</span>
                            <span className="text-amber-400 font-bold flex items-center gap-0.5">
                              <Star size={11} className="fill-current" />
                              {Number(chapter.rating).toFixed(1)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewChapter(chapter);
                      }}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                      title="Read Chapter"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChapterClick(chapter);
                      }}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#2A2A2A] hover:bg-[#3B82F6] text-white font-mono font-bold text-xs shadow-md shadow-black/50 transition-all cursor-pointer"
                    >
                      <span>Import</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EMPTY / ONBOARDING STATE (WHEN NO SERIES LOADED) ── */}
      {!seriesMetadata && chapters.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-neutral-900/40 border border-neutral-800/80 rounded-3xl backdrop-blur-xl space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-3xl bg-[#3B82F6]/10 border border-[#3B82F6]/25 flex items-center justify-center mx-auto text-[#3B82F6] shadow-xl shadow-black/50">
            <Zap className="h-8 w-8 text-[#3B82F6]" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold text-white font-sans">
              Ready to Scrape Comic Chapters
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed font-mono">
              Paste any comic or manga series URL in the input bar above to
              automatically fetch chapters, panel images, and ratings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
            <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-xs font-mono">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[10px]">
                  1
                </span>
                Paste Comic URL
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                Copy the URL from any supported comic site (Webtoons, Toonily, FlameComics, etc.).
              </p>
            </div>

            <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-xs font-mono">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[10px]">
                  2
                </span>
                Preview &amp; Filter
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                Filter chapters by rating, date, or read panels full screen in reader mode.
              </p>
            </div>

            <div className="bg-neutral-955 border border-neutral-800/80 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-[#3B82F6] font-bold text-xs font-mono">
                <span className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center text-[10px]">
                  3
                </span>
                Import to Editor
              </div>
              <p className="text-[11px] text-neutral-500 font-mono">
                Directly import chapter panels into the timeline video workspace.
              </p>
            </div>
          </div>

          {/* New Chapter CTA button */}
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => {
                const nav = (window as any).navigateTo;
                if (typeof nav === "function") {
                  nav("/scraper");
                } else {
                  window.history.pushState({}, "", "/scraper");
                  window.dispatchEvent(new Event("popstate"));
                }
              }}
              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-black/50 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-[#60A5FA]/30"
            >
              <Plus className="w-4 h-4" />
              Go to Scraper
            </button>
          </div>
        </div>
      )}

      {/* ── QUICK PREVIEW LIGHTBOX READER MODAL ── */}
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
