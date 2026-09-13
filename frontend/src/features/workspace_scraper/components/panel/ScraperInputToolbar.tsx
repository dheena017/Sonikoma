import React from "react";
import { createPortal } from "react-dom";
import {
  Book,
  Loader2,
  ImageIcon,
  Zap,
  MoreVertical,
  Clock,
  Copy,
  Trash2,
} from "lucide-react";
import { FavoritesManager } from "@/features/workspace_scraper/chapter-scraper/utils/FavoritesManager";
import { separateComicUrl, type SeparateUrlResult } from "@/api/endpoints/scraper";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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

function formatSeriesDisplay(url: string, rawTitle?: string) {
  if (rawTitle && rawTitle !== url && !rawTitle.startsWith("http")) {
    return { title: rawTitle, subtitle: "Saved Series", domain: "" };
  }
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");
    const segments = parsed.pathname.split("/").filter(Boolean);
    const contentSegments = segments.filter(
      (s) => !["en", "viewer", "read", "manga", "series", "comic", "chapter"].includes(s.toLowerCase())
    );
    let title = "";
    let chapter = "";
    for (const seg of contentSegments) {
      if (/^(ep|ch|chapter|episode)[-_]?\d+/i.test(seg)) {
        chapter = seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      } else if (!title && seg.length > 2 && !/^(genre|romance|action|fantasy|drama|comedy|horror|slice-of-life)$/i.test(seg)) {
        title = seg.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
    if (!title && contentSegments.length > 0) {
      title = contentSegments[0].replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    }
    const displayTitle = title || domain;
    const displaySubtitle = [domain, chapter, "Saved Series"].filter(Boolean).join(" • ");
    return { title: displayTitle, subtitle: displaySubtitle, domain };
  } catch {
    return { title: url, subtitle: "Saved Series", domain: "" };
  }
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
  const [menuAnchor, setMenuAnchor] = React.useState<{
    rect: DOMRect;
    series: any;
  } | null>(null);
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
            className="w-full bg-[#1E1E1E] border border-[#2F2F2F] hover:border-[#3B82F6]/60 focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 rounded-2xl px-6 py-4 text-sm text-[#E5E5E5] outline-none placeholder:text-[#6B7280] transition-all shadow-inner"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-[#121217]/98 backdrop-blur-xl border border-[#282834] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_20px_rgba(59,130,246,0.12)] z-[1000] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-[#282834] bg-[#0E0E12] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#3B82F6]" />
                  <span className="text-[11px] font-bold text-[#E5E5E5] uppercase tracking-wider font-mono">
                    Recent &amp; Bookmarked Episodes
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-bold bg-[#3B82F6]/20 text-[#60A5FA] rounded-full border border-[#3B82F6]/40 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                    {suggestions.length}
                  </span>
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-[#282834]/50 bg-[#121217]">
                {suggestions.map((series, idx) => {
                  const displayInfo = formatSeriesDisplay(series.url, series.title);

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
                      className="w-full px-4 py-3 hover:bg-[#181D2A] border-b border-[#282834]/50 last:border-b-0 flex items-center justify-between gap-3 transition-all cursor-pointer group bg-[#121217]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#181820] border border-[#2F2F38] group-hover:bg-[#3B82F6] group-hover:border-[#60A5FA] group-hover:shadow-[0_0_14px_rgba(59,130,246,0.6)] transition-all duration-200 flex-shrink-0 shadow-sm">
                          <Book className="w-4 h-4 text-[#3B82F6] group-hover:text-white transition-all duration-200 transform group-hover:scale-110" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-bold text-[#E5E5E5] group-hover:text-[#60A5FA] truncate leading-snug transition-colors">
                            {displayInfo.title}
                          </p>
                          <p className="text-[10.5px] text-[#9CA3AF] group-hover:text-neutral-300 truncate mt-0.5 transition-colors">
                            {displayInfo.subtitle}
                          </p>
                          <p className="text-[9px] text-[#6B7280] group-hover:text-neutral-400 font-mono truncate mt-0.5 select-all transition-colors">
                            {series.url}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 text-[8.5px] font-bold uppercase tracking-widest rounded border bg-[#181820] text-[#9CA3AF] border-[#2F2F38] group-hover:bg-[#3B82F6]/20 group-hover:text-[#93C5FD] group-hover:border-[#3B82F6]/50 transition-all">
                          Recent
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            if (menuAnchor && menuAnchor.series.url === series.url) {
                              setMenuAnchor(null);
                            } else {
                              setMenuAnchor({ rect, series });
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-[#181820] hover:bg-[#3B82F6] hover:border-[#60A5FA] text-[#9CA3AF] hover:text-white border border-[#2F2F38] flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                          title="Options"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
            <Tooltip
              text="Extract and import panel images directly from this chapter URL"
              placement="bottom"
              offset={10}
              disabled={isScraping}
            >
              <button
                type="button"
                onClick={handleImportClick}
                disabled={isScraping || !targetUrl.trim()}
                className={`btn-primary group relative w-full justify-center px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center gap-2.5 ${
                  isScraping ? "cursor-wait" : "cursor-pointer"
                } ${
                  separatedData?.is_chapter_url || !separatedData?.is_series_url
                    ? "border-[#3B82F6]/60 shadow-[0_0_15px_rgba(59,130,246,0.22)]"
                    : ""
                }`}
                aria-label="Import Chapter Images"
              >
                {isScraping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4 text-white transition-transform duration-200 group-hover:scale-110" />
                    <span>Import Chapter Images</span>
                  </>
                )}
              </button>
            </Tooltip>

            <Tooltip
              text="Browse series catalog & batch scrape multiple chapters"
              placement="bottom"
              offset={10}
              disabled={isScraping}
            >
              <button
                type="button"
                onClick={handleOpenChapterScraperClick}
                disabled={!targetUrl.trim() || isScraping}
                className={`btn-primary group relative w-full justify-center px-5 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed flex items-center gap-2.5 ${
                  isScraping ? "cursor-wait" : "cursor-pointer"
                } ${
                  separatedData?.is_series_url && !separatedData?.is_chapter_url
                    ? "border-[#3B82F6]/60 shadow-[0_0_15px_rgba(59,130,246,0.22)]"
                    : ""
                }`}
                aria-label="Import Chapter Scraper"
              >
                <Zap className="h-4 w-4 text-white transition-transform duration-200 group-hover:scale-110" />
                <span>Import Chapter Scraper</span>
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Options Menu Portal (Unclipped by any parent overflow) */}
      {menuAnchor && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[99999]"
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top:
                menuAnchor.rect.bottom + 8 + 84 >
                (typeof window !== "undefined" ? window.innerHeight : 1000)
                  ? Math.max(8, menuAnchor.rect.top - 84)
                  : menuAnchor.rect.bottom + 6,
              left: Math.max(12, menuAnchor.rect.right - 144),
            }}
            className="w-36 bg-[#16161D] border border-[#2F2F3D] rounded-xl shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(59,130,246,0.25)] py-1.5 z-[100000] animate-in fade-in-0 zoom-in-95 duration-100 select-none"
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (menuAnchor.series.url) {
                  navigator.clipboard.writeText(menuAnchor.series.url);
                }
                setMenuAnchor(null);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#3B82F6] flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#3B82F6] group-hover:text-white" />
              <span>Copy URL</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (menuAnchor.series.url) {
                  FavoritesManager.removeEnteredUrl(menuAnchor.series.url);
                  FavoritesManager.removeBookmark(menuAnchor.series.url);
                  setSuggestions((prev) =>
                    prev.filter((item) => item.url !== menuAnchor.series.url)
                  );
                }
                setMenuAnchor(null);
              }}
              className="w-full px-3.5 py-2 text-left text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-600 flex items-center gap-2.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
