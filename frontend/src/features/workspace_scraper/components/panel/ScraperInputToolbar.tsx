import React from "react";
import {
  Book,
  Loader2,
  ImageIcon,
  Zap,
  MoreVertical,
  Clock,
} from "lucide-react";
import { parseWebtoonUrl, extractWebtoonUrl } from "@/shared/utils/url";
import { FavoritesManager } from "@/features/workspace_scraper/episode-scraper/utils/FavoritesManager";

export interface ScraperInputToolbarProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  isScraping?: boolean;
  isProcessing?: boolean;
  handleScrape?: () => void;
  resetWorkspace?: () => void;
  onOpenEpisodeScraper?: (url: string) => void;
  actionSlot?: React.ReactNode;
  setSeriesTitle?: (title: string) => void;
  setScrapedGenre?: (genre: string) => void;
  setChapterNumber?: (num: string) => void;
  setChapterTitle?: (title: string) => void;
}

export const ScraperInputToolbar: React.FC<ScraperInputToolbarProps> = ({
  targetUrl,
  setTargetUrl,
  isScraping = false,
  isProcessing = false,
  handleScrape,
  resetWorkspace,
  onOpenEpisodeScraper,
  actionSlot,
  setSeriesTitle,
  setScrapedGenre,
  setChapterNumber,
  setChapterTitle,
}) => {
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [openSuggestionMenuIdx, setOpenSuggestionMenuIdx] = React.useState<
    number | null
  >(null);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const bookmarks = FavoritesManager.getBookmarks();
      const reads = FavoritesManager.getReadEpisodes();
      const entered = FavoritesManager.getEnteredUrls();
      const merged = [...entered, ...bookmarks, ...reads];
      const uniqueUrls = Array.from(new Set(merged));
      let suggestionsData = uniqueUrls.map((url) => {
        const parsed = parseWebtoonUrl(url);
        return {
          url: url,
          title: parsed.episode || parsed.title || "Webtoon Episode",
          genre: parsed.genre || "general",
        };
      });

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
      const normalized = extractWebtoonUrl(url);
      if (normalized !== targetUrl && resetWorkspace) {
        resetWorkspace();
      }
      setTargetUrl(normalized);
    }
  };

  const handleImportClick = () => {
    if (!targetUrl.trim()) return;
    FavoritesManager.addEnteredUrl(targetUrl.trim());
    handleScrape?.();
  };

  const handleOpenEpisodeScraperClick = () => {
    if (!targetUrl.trim()) return;
    const url = targetUrl.trim();
    FavoritesManager.addEnteredUrl(url);
    localStorage.setItem("episode_scraper_url", url);
    if (onOpenEpisodeScraper) {
      onOpenEpisodeScraper(url);
    } else {
      const nav = (window as any).navigateTo;
      const targetPath = `/scraper/episode-scraper?url=${encodeURIComponent(
        url
      )}`;
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative group flex-grow z-30" ref={containerRef}>
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-500" />
        <input
          id="target_url_input"
          type="url"
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
                const parsed = parseWebtoonUrl(series.url);
                const seriesTitleText =
                  parsed.title || series.title || "Webtoon Series";
                const chapterText =
                  parsed.chapterTitle ||
                  (parsed.chapterNumber
                    ? `Chapter ${parsed.chapterNumber}`
                    : "Chapter 1");

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (series.url) {
                        const normalized = extractWebtoonUrl(series.url);
                        if (normalized !== targetUrl && resetWorkspace) {
                          resetWorkspace();
                        }
                        setTargetUrl(normalized);
                        if (setSeriesTitle) setSeriesTitle(parsed.title);
                        if (setScrapedGenre) setScrapedGenre(parsed.genre);
                        if (setChapterNumber)
                          setChapterNumber(parsed.chapterNumber);
                        if (setChapterTitle && parsed.chapterTitle)
                          setChapterTitle(parsed.chapterTitle);
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
            className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg glass-interactive active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isScraping ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
                <span>Extracting...</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" /> Import Images
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleOpenEpisodeScraperClick}
            disabled={!targetUrl.trim()}
            className="relative px-5 py-3.5 bg-neutral-950 hover:bg-neutral-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl text-xs sm:text-sm font-bold text-purple-300 hover:text-purple-200 transition-all shadow-lg glass-interactive active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            title="Browse and select specific episodes for this series URL"
          >
            <Zap className="h-4 w-4 text-purple-400" />
            Open in Episode Scraper
          </button>
        </div>
      )}
    </div>
  );
};
