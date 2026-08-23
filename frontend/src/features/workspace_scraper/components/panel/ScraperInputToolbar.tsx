import React from "react";
import {
  Book,
  Loader2,
  ImageIcon,
  Zap,
  MoreVertical,
  Clock,
} from "lucide-react";
import { FavoritesManager } from "@/features/workspace_scraper/chapter-scraper/utils/FavoritesManager";
import { separateComicUrl, type SeparateUrlResult } from "@/api/endpoints/scraper";

export interface ScraperInputToolbarProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  isScraping?: boolean;
  isProcessing?: boolean;
  handleScrape?: () => void;
  resetWorkspace?: () => void;
  onOpenChapterScraper?: (url: string) => void;
  onOpenEpisodeScraper?: (url: string) => void;
  actionSlot?: React.ReactNode;
  setSeriesTitle?: (title: string) => void;
  setScrapedGenre?: (genre: string) => void;
  setChapterNumber?: (num: string) => void;
  setChapterTitle?: (title: string) => void;
  fetchWithInterceptor?: typeof fetch;
  onSeparatedDataChange?: (data: SeparateUrlResult | null) => void;
}

export const ScraperInputToolbar: React.FC<ScraperInputToolbarProps> = ({
  targetUrl,
  setTargetUrl,
  isScraping = false,
  isProcessing = false,
  handleScrape,
  resetWorkspace,
  onOpenChapterScraper,
  onOpenEpisodeScraper,
  actionSlot,
  setSeriesTitle,
  setScrapedGenre,
  setChapterNumber,
  setChapterTitle,
  fetchWithInterceptor,
  onSeparatedDataChange,
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [openSuggestionMenuIdx, setOpenSuggestionMenuIdx] = React.useState<
    number | null
  >(null);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [separatedData, setSeparatedData] = React.useState<SeparateUrlResult | null>(null);
  const [isSeparating, setIsSeparating] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Debounced URL separation via backend /api/v1/scraper/separate-url
  React.useEffect(() => {
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setSeparatedData(null);
      onSeparatedDataChange?.(null);
      setIsSeparating(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        setIsSeparating(true);
        const fetchClient = fetchWithInterceptor || (window.fetch.bind(window) as any);
        const result = await separateComicUrl(fetchClient, trimmed);
        if (isMounted && result && result.success) {
          setSeparatedData(result);
          onSeparatedDataChange?.(result);

          // Auto-populate series title if not already populated
          if (result.title_slug && setSeriesTitle) {
            const formattedTitle = result.title_slug
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setSeriesTitle(formattedTitle);
          }

          // Auto-populate chapter number
          if (result.chapter_number && setChapterNumber) {
            setChapterNumber(result.chapter_number);
          }

          // Auto-populate chapter title
          if (result.chapter_slug && setChapterTitle) {
            const formattedCh = result.chapter_slug
              .replace(/[-_]+/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase());
            setChapterTitle(formattedCh);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.debug("[ScraperInputToolbar] URL separation background fetch:", err);
        }
      } finally {
        if (isMounted) setIsSeparating(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [targetUrl, fetchWithInterceptor, setSeriesTitle, setChapterNumber, setChapterTitle, onSeparatedDataChange]);

  React.useEffect(() => {
    try {
      const bookmarks = FavoritesManager.getBookmarks();
      const reads = FavoritesManager.getReadEpisodes();
      const entered = FavoritesManager.getEnteredUrls();
      const merged = [...entered, ...bookmarks, ...reads];
      const uniqueUrls = Array.from(new Set(merged));
      let suggestionsData = uniqueUrls.map((url) => ({
        url: url,
        title: url,
        genre: "general",
      }));

      if (targetUrl && targetUrl.trim()) {
        const searchVal = targetUrl.trim().toLowerCase();
        suggestionsData = suggestionsData.filter(
          (item) =>
            item.url.toLowerCase().includes(searchVal) ||
            item.title.toLowerCase().includes(searchVal)
        );
      }

      setSuggestions(suggestionsData.slice(0, 8));
    } catch (e) {
      console.warn("Failed to load autocomplete suggestions:", e);
    }
  }, [showSuggestions, targetUrl]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData?.getData("text") || "";
    const url = pasted.trim();
    if (url) {
      if (url !== targetUrl && resetWorkspace) {
        resetWorkspace();
      }
      setTargetUrl(url);
    }
  };

  const handleImportClick = () => {
    const trimmed = targetUrl.trim();
    if (!trimmed) return;
    FavoritesManager.addEnteredUrl(trimmed);
    handleScrape?.();
  };

  const handleOpenChapterScraperClick = () => {
    const destinationUrl = separatedData?.series_url || targetUrl.trim();
    let seriesSlug =
      separatedData?.series_slug ||
      separatedData?.title_slug;

    if (!seriesSlug && destinationUrl) {
      try {
        const u = new URL(
          destinationUrl.startsWith("http")
            ? destinationUrl
            : `https://${destinationUrl}`
        );
        const segments = u.pathname.split("/").filter(Boolean);
        const ignored = new Set([
          "list", "viewer", "chapter", "episode", "detail", "read", "index",
          "comic", "comics", "manga", "series", "en", "ko", "id", "zh", "webtoon"
        ]);
        while (segments.length > 0 && ignored.has(segments[segments.length - 1].toLowerCase())) {
          segments.pop();
        }
        if (
          segments.length > 1 &&
          (/^(chapter|episode|ep|ch)[-_]?\d+/i.test(segments[segments.length - 1]) ||
           /^\d+$/.test(segments[segments.length - 1]))
        ) {
          segments.pop();
        }
        seriesSlug = segments[segments.length - 1] || "";
      } catch {
        seriesSlug = destinationUrl.split("/").filter(Boolean).pop() || "";
      }
    }

    if (destinationUrl) {
      localStorage.setItem("chapter_scraper_url", destinationUrl);
      localStorage.setItem("episode_scraper_url", destinationUrl);
    }

    const opener = onOpenChapterScraper || onOpenEpisodeScraper;
    if (opener) {
      opener(destinationUrl);
    } else {
      const nav = (window as any).navigateTo;
      const targetPath = seriesSlug
        ? `/scraper/${encodeURIComponent(seriesSlug)}`
        : "/scraper";
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative group flex-grow z-30" ref={containerRef}>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-500" />
          <input
            id="target_url_input"
            type="text"
            autoComplete="off"
            value={targetUrl}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              setShowSuggestions(true);
            }}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isProcessing && targetUrl.trim()) {
                handleImportClick();
              }
            }}
            placeholder="Paste any Manhwa, Manga, Webtoon, or Webcomic reader URL..."
            className="relative w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-purple-500 transition-all shadow-inner"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-gradient-to-b from-neutral-900/95 to-neutral-950/85 border border-neutral-800/60 rounded-xl shadow-2xl z-[1000] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-sm">
              <div className="px-4 py-3 border-b border-neutral-800/40 bg-gradient-to-r from-purple-950/30 to-neutral-950/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider">
                      Recent &amp; Bookmarked Episodes
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
                      {suggestions.length}
                    </span>
                  </div>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800/30 bg-neutral-950/60">
                {suggestions.map((series, idx) => {
                  const seriesTitleText = series.title || series.url || "Webtoon Series";
                  const chapterText = "Saved Series";

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (series.url) {
                          if (series.url !== targetUrl && resetWorkspace) {
                            resetWorkspace();
                          }
                          setTargetUrl(series.url);
                          if (setSeriesTitle && series.title) setSeriesTitle(series.title);
                        }
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-purple-600/15 border-b border-neutral-800/20 last:border-b-0 flex items-center justify-between gap-3 transition-all cursor-pointer group bg-neutral-950/40 hover:bg-neutral-900/60 relative"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600/30 to-purple-700/20 rounded-lg flex items-center justify-center border border-purple-500/30 flex-shrink-0 shadow-sm">
                          <Book className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-neutral-100 group-hover:text-purple-300 truncate leading-snug transition-colors">
                            {seriesTitleText}
                          </p>
                          <p className="text-[10px] text-neutral-500 group-hover:text-neutral-400 truncate mt-0.5 transition-colors">
                            {chapterText}
                          </p>
                          <p className="text-[9px] text-neutral-600 font-mono truncate mt-0.5 select-all group-hover:text-neutral-500 transition-colors">
                            {series.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded border bg-purple-500/15 text-purple-300 border-purple-500/30 group-hover:bg-purple-500/25 transition-colors">
                          Recent
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenSuggestionMenuIdx(
                              openSuggestionMenuIdx === idx ? null : idx
                            );
                          }}
                          className="w-7 h-7 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-neutral-400 hover:text-purple-300 border border-purple-500/20 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {actionSlot || (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleImportClick}
              disabled={isScraping || !targetUrl.trim()}
              className={`relative px-6 py-3.5 border rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg glass-interactive active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer ${
                separatedData?.is_chapter_url || !separatedData?.is_series_url
                  ? "bg-purple-600 hover:bg-purple-500 border-purple-500/50 text-white shadow-purple-900/20"
                  : "bg-neutral-950 hover:bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white"
              }`}
            >
              {isScraping ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4" /> Import chapter Images
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleOpenChapterScraperClick}
              disabled={!targetUrl.trim()}
              className={`relative px-5 py-3.5 border rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg glass-interactive active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer ${
                separatedData?.is_series_url && !separatedData?.is_chapter_url
                  ? "bg-purple-600 hover:bg-purple-500 border-purple-500/50 text-white shadow-purple-900/20"
                  : "bg-neutral-950 hover:bg-neutral-900 border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-purple-200"
              }`}
              title="Browse and select specific chapters for this series URL"
            >
              <Zap className="h-4 w-4 text-purple-400" />
              Import Chapter Scraper
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
