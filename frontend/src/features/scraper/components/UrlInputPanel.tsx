import React from "react";
import { Sparkles, Image as ImageIcon, Layout, Book, Zap, MoreVertical } from "lucide-react";
import { useAIModels } from "@/features/ai/hooks/useAIModels";
import { NotificationType } from "@/features/notification";
import { extractWebtoonUrl, parseWebtoonUrl, isKnownSite, addCustomSite, getProxiedImageUrl } from "@/utils/url";
import { FavoritesManager } from "@/features/scraper/components/FavoritesManager";

// Configuration Constants (Removed hardcoding from JSX)
const NARRATION_STYLES = [
  { id: "long", label: "Detailed Recap (YouTube Long-form)" },
  { id: "short", label: "Dialogue Focused (Shorts/TikTok)" },
];

const LAYOUT_MODES = [
  { id: "separate", label: "Separate Panels (Fast)" },
  { id: "stitched", label: "Stitched Strip (Slow)" },
];

interface UrlInputPanelProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isProcessing: boolean;
  isScraping?: boolean;
  handleGenerateVideo: () => void;
  handleScrape?: () => void;
  addNotification: (message: string, type: NotificationType) => void;
  narrationStyle?: string;
  setNarrationStyle?: (style: string) => void;
  seriesTitle?: string;
  setSeriesTitle?: (title: string) => void;
  chapterNumber?: string;
  setChapterNumber?: (num: string) => void;
  chapterTitle?: string;
  setChapterTitle?: (title: string) => void;
  scrapedGenre?: string;
  setScrapedGenre?: (genre: string) => void;
  seriesAuthor?: string;
  setSeriesAuthor?: (author: string) => void;
  seriesCoverImage?: string;
  setSeriesCoverImage?: (coverImage: string) => void;
  seriesSynopsis?: string;
  setSeriesSynopsis?: (synopsis: string) => void;
  smartSlice?: boolean;
  setSmartSlice?: (v: boolean) => void;
  resetWorkspace?: () => void;
  handleSaveMeta?: () => void;
  cropSensitivity?: number;
  setCropSensitivity?: (v: number) => void;
  autoSplitTallStrips?: boolean;
  setAutoSplitTallStrips?: (v: boolean) => void;
  actionSlot?: React.ReactNode;
  onOpenEpisodeScraper?: (url: string) => void;
  fetchWithInterceptor?: typeof fetch;
}

const UrlInputPanel = React.memo((props: UrlInputPanelProps) => {
  const { models: aiModels } = useAIModels();
  const {
    targetUrl,
    setTargetUrl,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping = false,
    handleScrape,
    addNotification,
    narrationStyle = "long",
    setNarrationStyle,
    seriesTitle = "",
    setSeriesTitle,
    chapterNumber = "",
    setChapterNumber,
    chapterTitle = "",
    setChapterTitle,
    scrapedGenre = "",
    setScrapedGenre,
    seriesAuthor = "",
    setSeriesAuthor,
    seriesCoverImage = "",
    setSeriesCoverImage,
    seriesSynopsis = "",
    setSeriesSynopsis,
    smartSlice = true,
    setSmartSlice,
    resetWorkspace,
    cropSensitivity = 50,
    setCropSensitivity,
    autoSplitTallStrips = true,
    setAutoSplitTallStrips,
    actionSlot,
    onOpenEpisodeScraper,
    fetchWithInterceptor,
  } = props;

  const [isAiSetupRunning, setIsAiSetupRunning] = React.useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [openSuggestionMenuIdx, setOpenSuggestionMenuIdx] = React.useState<number | null>(null);

  const handleAiAutoSetup = async (urlToUse?: string) => {
    const rawUrl = (urlToUse || targetUrl).trim();
    if (!rawUrl) {
      addNotification("Please paste or enter a comic/webtoon URL first.", "error");
      return;
    }

    setIsAiSetupRunning(true);
    try {
      // 1. Structural URL heuristic parsing
      const parsed = parseWebtoonUrl(rawUrl);
      if (parsed) {
        if (setSeriesTitle && parsed.title && parsed.title !== "Webtoon Comic") {
          setSeriesTitle(parsed.title);
        }
        if (setChapterNumber && parsed.chapterNumber) {
          setChapterNumber(parsed.chapterNumber);
        }
        if (setScrapedGenre && parsed.genre && parsed.genre !== "general") {
          setScrapedGenre(parsed.genre);
        }
        if (setChapterTitle && parsed.chapterTitle) {
          setChapterTitle(parsed.chapterTitle);
        }
      }

      // Add custom site if domain is unrecognised
      try {
        const cleanUrl = rawUrl.startsWith("http") ? rawUrl : "https://" + rawUrl;
        const urlObj = new URL(cleanUrl);
        if (!isKnownSite(rawUrl)) {
          addCustomSite(urlObj.hostname);
          setCustomSiteAdded(true);
        }
      } catch {}

      // 2. Fetch AI / backend scraped metadata
      const fetcher = fetchWithInterceptor || window.fetch;
      const response = await fetcher("/api/scrape-episodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: rawUrl, max_episodes: 5 }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.series_metadata) {
          const meta = data.series_metadata;
          if (meta.title && setSeriesTitle) setSeriesTitle(meta.title);
          if (meta.genre && setScrapedGenre) setScrapedGenre(meta.genre);
          if (meta.author && setSeriesAuthor) setSeriesAuthor(meta.author);
          if (meta.cover_image && setSeriesCoverImage) setSeriesCoverImage(meta.cover_image);
          if (meta.description && setSeriesSynopsis) setSeriesSynopsis(meta.description);
        }
      }

      FavoritesManager.addEnteredUrl(rawUrl);
      addNotification("✨ AI Auto-Setup complete! Title, chapter, genre & cover image metadata applied.", "success");
    } catch (e: any) {
      console.warn("[AI Auto-Setup] Metadata fetch warning:", e);
      addNotification("AI Auto-Setup applied URL structural parameters.", "info");
    } finally {
      setIsAiSetupRunning(false);
    }
  };
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [customSiteAdded, setCustomSiteAdded] = React.useState(false);

  // Reset the "added" badge when URL changes
  React.useEffect(() => { setCustomSiteAdded(false); }, [targetUrl]);

  const [showTitleSuggestions, setShowTitleSuggestions] = React.useState(false);
  const [showGenreSuggestions, setShowGenreSuggestions] = React.useState(false);
  const titleContainerRef = React.useRef<HTMLDivElement>(null);
  const genreContainerRef = React.useRef<HTMLDivElement>(null);

  const titleSuggestions = React.useMemo(() => {
    try {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const merged = [...recents, ...favorites];
      const uniqueMap = new Map();
      merged.forEach(item => {
        if (item.title) {
          uniqueMap.set(item.title, item);
        }
      });
      return Array.from(uniqueMap.values()).slice(0, 8);
    } catch (e) {
      console.warn("Failed to load title suggestions:", e);
      return [];
    }
  }, [showTitleSuggestions]);

  const genreSuggestions = React.useMemo(() => {
    try {
      const recents = FavoritesManager.getRecent();
      const favorites = FavoritesManager.getFavorites();
      const merged = [...recents, ...favorites];
      const genres = new Set<string>();
      merged.forEach(item => {
        if (item.genre) {
          genres.add(item.genre.trim());
        }
      });
      if (genres.size === 0) {
        ['Action', 'Fantasy', 'Romance', 'Comedy', 'Drama', 'Thriller', 'Slice of Life'].forEach(g => genres.add(g));
      }
      return Array.from(genres).slice(0, 8);
    } catch (e) {
      console.warn("Failed to load genre suggestions:", e);
      return [];
    }
  }, [showGenreSuggestions]);

  React.useEffect(() => {
    try {
      const bookmarks = FavoritesManager.getBookmarks();
      const reads = FavoritesManager.getReadEpisodes();
      const entered = FavoritesManager.getEnteredUrls();
      const merged = [...entered, ...bookmarks, ...reads];
      const uniqueUrls = Array.from(new Set(merged));
      let suggestionsData = uniqueUrls.map(url => {
        const parsed = parseWebtoonUrl(url);
        return {
          url: url,
          title: parsed.episode || parsed.title || "Webtoon Episode",
          genre: parsed.genre || "general",
        };
      });

      if (targetUrl && targetUrl.trim()) {
        const searchVal = targetUrl.trim().toLowerCase();
        suggestionsData = suggestionsData.filter(item => 
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
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (titleContainerRef.current && !titleContainerRef.current.contains(event.target as Node)) {
        setShowTitleSuggestions(false);
      }
      if (genreContainerRef.current && !genreContainerRef.current.contains(event.target as Node)) {
        setShowGenreSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
      const targetPath = `/episode-scraper?url=${encodeURIComponent(url)}`;
      if (typeof nav === "function") {
        nav(targetPath);
      } else {
        window.history.pushState({}, "", targetPath);
        window.dispatchEvent(new Event("popstate"));
      }
    }
  };

  return (
    <div
      id="dynamic_input_box"
      className="relative z-20 bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-8 min-w-0 w-full overflow-visible animate-in fade-in zoom-in-95 duration-500"
    >
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-400">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase font-mono">
              Project Constructor
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
            Initialize New Video Pipeline
          </h2>
          <p className="text-xs text-neutral-400 font-medium">
            Define your project parameters and Manhwa, Manga, or Webcomic source link to begin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleAiAutoSetup()}
          disabled={isAiSetupRunning || !targetUrl.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-purple-900/30 active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0 border border-purple-400/30"
          title="Use AI to automatically extract series title, chapter number, genre, author, and cover image from any Manhwa or Manga URL"
        >
          <Sparkles className={`h-4 w-4 text-amber-300 ${isAiSetupRunning ? 'animate-spin' : ''}`} />
          {isAiSetupRunning ? "AI Extracting & Setting Up..." : "✨ AI Auto-Setup"}
        </button>
      </div>

      {/* 2. Series Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 p-6 rounded-2xl border border-white/5">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-3.5 h-3.5 text-purple-500" /> Series Identity
          </h3>
          <div className="space-y-3">
            <div className="space-y-1 relative" ref={titleContainerRef}>
              <label className="text-[10px] font-bold text-neutral-500 uppercase">
                Series Title
              </label>
              <input
                type="text"
                autoComplete="off"
                value={seriesTitle}
                onFocus={() => setShowTitleSuggestions(true)}
                onChange={(e) => {
                  setSeriesTitle?.(e.target.value);
                  setShowTitleSuggestions(false);
                }}
                placeholder="e.g. Boundless Necromancer"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all"
              />
              {showTitleSuggestions && titleSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-850 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto divide-y divide-neutral-900/50">
                  {titleSuggestions.map((series, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSeriesTitle?.(series.title);
                        if (setScrapedGenre && series.genre) setScrapedGenre(series.genre);
                        if (setTargetUrl && series.url) setTargetUrl(series.url);
                        if (setSeriesCoverImage && series.cover_image) setSeriesCoverImage(series.cover_image);
                        if (setSeriesAuthor && series.author) setSeriesAuthor(series.author);
                        if (setSeriesSynopsis && series.synopsis) setSeriesSynopsis(series.synopsis);
                        setShowTitleSuggestions(false);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-neutral-900/60 flex items-center gap-2 transition-colors text-left text-xs font-bold text-neutral-350"
                    >
                      {series.cover_image && (
                        <img
                          src={getProxiedImageUrl(series.cover_image, series.url)}
                          alt=""
                          className="w-6 h-6 object-cover rounded border border-neutral-850"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
                          }}
                        />
                      )}
                      <div className="flex-grow min-w-0">
                        <div className="truncate">{series.title}</div>
                        {series.genre && <div className="text-[9px] text-neutral-500 font-mono">{series.genre}</div>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                  Chapter #
                </label>
                <input
                  type="text"
                  value={chapterNumber}
                  onChange={(e) => setChapterNumber?.(e.target.value)}
                  placeholder="72"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all font-mono"
                />
              </div>
              <div className="space-y-1 relative" ref={genreContainerRef}>
                <label className="text-[10px] font-bold text-neutral-500 uppercase">
                  Genre
                </label>
                <input
                  type="text"
                  autoComplete="off"
                  value={scrapedGenre}
                  onFocus={() => setShowGenreSuggestions(true)}
                  onChange={(e) => {
                    setScrapedGenre?.(e.target.value);
                    setShowGenreSuggestions(false);
                  }}
                  placeholder="Fantasy"
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-4 py-2.5 text-sm text-neutral-200 outline-none transition-all"
                />
                {showGenreSuggestions && genreSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-neutral-950 border border-neutral-850 rounded-xl shadow-2xl z-30 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-48 overflow-y-auto divide-y divide-neutral-900/50">
                    {genreSuggestions.map((genre, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setScrapedGenre?.(genre);
                          setShowGenreSuggestions(false);
                        }}
                        className="w-full px-4 py-2 hover:bg-neutral-900/60 transition-colors text-left text-xs font-bold text-neutral-350"
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Batch Settings */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Batch Presets
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <div>
                <p className="text-[11px] font-bold text-neutral-200">
                  Auto-Crop Sensitivity
                </p>
                <p className="text-[9px] text-neutral-500 font-mono">
                  Edge detection threshold
                </p>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={cropSensitivity}
                onChange={(e) => setCropSensitivity?.(parseInt(e.target.value))}
                className="w-24 accent-purple-500"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
              <p className="text-[11px] font-bold text-neutral-200">
                Auto-Split Strips
              </p>
              <button
                onClick={() => setAutoSplitTallStrips?.(!autoSplitTallStrips)}
                className={`w-10 h-5 rounded-full relative ${
                  autoSplitTallStrips ? "bg-purple-600" : "bg-neutral-800"
                }`}
              >
                <div
                  className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${
                    autoSplitTallStrips ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. URL Input & Action */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] font-mono pl-1">
            Source Link
          </label>
          {targetUrl.trim() && (
            <button
              type="button"
              onClick={() => handleAiAutoSetup()}
              disabled={isAiSetupRunning}
              className="text-[10px] font-bold text-purple-300 hover:text-purple-200 flex items-center gap-1.5 bg-purple-950/60 hover:bg-purple-900/70 border border-purple-700/50 px-3 py-1 rounded-lg transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <Sparkles className={`w-3 h-3 text-amber-300 ${isAiSetupRunning ? 'animate-spin' : ''}`} />
              {isAiSetupRunning ? "Extracting..." : "Auto-Fill Setup with AI"}
            </button>
          )}
        </div>
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
              <div className="absolute left-0 right-0 top-full mt-2 bg-[#111116] border border-neutral-800 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[200] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/40">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Recent & Bookmarked Episodes
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800/50">
                  {suggestions.map((series, idx) => {
                    const parsed = parseWebtoonUrl(series.url);
                    const seriesTitleText = parsed.title || series.title || "Webtoon Series";
                    const chapterText = parsed.chapterTitle || (parsed.chapterNumber ? `Chapter ${parsed.chapterNumber}` : "Chapter 1");

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (series.url) {
                            setTargetUrl(series.url);
                            if (setSeriesTitle) setSeriesTitle(parsed.title);
                            if (setScrapedGenre) setScrapedGenre(parsed.genre);
                            if (setChapterNumber) setChapterNumber(parsed.chapterNumber);
                            if (setChapterTitle && parsed.chapterTitle) setChapterTitle(parsed.chapterTitle);
                          }
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-2.5 hover:bg-neutral-800/60 flex items-center justify-between gap-3 transition-colors cursor-pointer group relative"
                      >
                        {/* Left: Icon & Text content */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 bg-neutral-850 rounded-lg flex items-center justify-center border border-neutral-800 flex-shrink-0">
                            <Book className="w-4 h-4 text-purple-400" />
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="text-xs font-bold text-neutral-200 truncate leading-snug">
                              {seriesTitleText}
                            </p>
                            <p className="text-[10px] text-neutral-400 truncate mt-0.5">
                              {chapterText}
                            </p>
                            <p className="text-[9px] text-neutral-600 font-mono truncate mt-0.5 select-all">
                              {series.url}
                            </p>
                          </div>
                        </div>

                        {/* Right side: Single DRAFT status badge & Single 3-dot menu button */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border bg-neutral-800/80 text-neutral-400 border-neutral-700/50">
                            DRAFT
                          </span>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenSuggestionMenuIdx(openSuggestionMenuIdx === idx ? null : idx);
                              }}
                              className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/70 text-neutral-400 hover:text-white border border-white/10 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {openSuggestionMenuIdx === idx && (
                              <div
                                className="absolute right-0 top-full mt-1 w-36 bg-[#16161b] border border-white/10 rounded-xl shadow-2xl py-1 z-[300] animate-in fade-in zoom-in-95 duration-100"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (series.url) {
                                      setTargetUrl(series.url);
                                      if (setSeriesTitle) setSeriesTitle(parsed.title);
                                      if (setScrapedGenre) setScrapedGenre(parsed.genre);
                                      if (setChapterNumber) setChapterNumber(parsed.chapterNumber);
                                      if (setChapterTitle && parsed.chapterTitle) setChapterTitle(parsed.chapterTitle);
                                    }
                                    setShowSuggestions(false);
                                    setOpenSuggestionMenuIdx(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  Use Episode
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(series.url);
                                    addNotification?.("URL copied to clipboard", "success");
                                    setOpenSuggestionMenuIdx(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-neutral-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                  Copy Link
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Unknown-site banner: only shown for unrecognised domains */}
          {targetUrl.trim() && !isKnownSite(targetUrl) && (
            <div className="flex items-center justify-between gap-3 mt-2 px-4 py-2 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-widest font-mono shrink-0">⚠ Unknown Site</span>
                <span className="text-[10px] text-amber-400/80 font-mono truncate">
                  {(() => { try { return new URL(targetUrl.startsWith("http") ? targetUrl : "https://" + targetUrl).hostname; } catch { return targetUrl; } })()}
                </span>
              </div>
              {customSiteAdded ? (
                <span className="text-[10px] font-bold text-emerald-400 font-mono shrink-0 flex items-center gap-1">
                  ✓ Added
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    try {
                      const cleanUrl = targetUrl.startsWith("http") ? targetUrl : "https://" + targetUrl;
                      const urlObj = new URL(cleanUrl);
                      addCustomSite(urlObj.hostname);
                      setCustomSiteAdded(true);

                      // Automatically extract and set up project metadata from URL
                      const parsed = parseWebtoonUrl(targetUrl);
                      if (parsed) {
                        if (setSeriesTitle && parsed.title && parsed.title !== "Webtoon Comic") {
                          setSeriesTitle(parsed.title);
                        }
                        if (setChapterNumber && parsed.chapterNumber) {
                          setChapterNumber(parsed.chapterNumber);
                        }
                        if (setScrapedGenre && parsed.genre && parsed.genre !== "general") {
                          setScrapedGenre(parsed.genre);
                        }
                        if (setChapterTitle && parsed.chapterTitle) {
                          setChapterTitle(parsed.chapterTitle);
                        }
                      }

                      // Save to recents / entered URLs setup history
                      FavoritesManager.addEnteredUrl(targetUrl.trim());

                      addNotification(`Site "${urlObj.hostname}" added to known sites & project setup applied!`, "success");
                    } catch {
                      addNotification("Could not parse the URL to extract a hostname.", "error");
                    }
                  }}
                  className="text-[10px] font-bold font-mono shrink-0 px-3 py-1 rounded-lg bg-amber-700/30 hover:bg-amber-600/40 border border-amber-700/50 hover:border-amber-500/60 text-amber-200 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  + Add URL
                </button>
              )}
            </div>
          )}

          {actionSlot || (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleImportClick}
                disabled={isScraping || !targetUrl.trim()}
                className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-2xl text-xs sm:text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
              >
                {isScraping ? (
                  "Initializing..."
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
                className="relative px-5 py-3.5 bg-neutral-950 hover:bg-neutral-900 border border-purple-500/30 hover:border-purple-500/60 rounded-2xl text-xs sm:text-sm font-bold text-purple-300 hover:text-purple-200 transition-all shadow-lg active:scale-95 disabled:opacity-40 flex items-center gap-2 cursor-pointer"
                title="Browse and select specific episodes for this series URL"
              >
                <Zap className="h-4 w-4 text-purple-400" />
                Open in Episode Scraper
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Advanced Settings */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
          className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors pl-1"
        >
          <span
            className={`transition-transform duration-300 ${
              advancedSettingsOpen ? "rotate-90" : ""
            }`}
          >
            ▸
          </span>
          Global Pipeline Constraints
        </button>
      </div>

      {advancedSettingsOpen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-neutral-800/50 animate-in fade-in slide-in-from-top-2">
          {/* Engine Select */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Voice Engine
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {aiModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Narration Strategy */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Narration Style
            </label>
            <select
              value={narrationStyle}
              onChange={(e) => setNarrationStyle?.(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {NARRATION_STYLES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Layout Mode */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
              Layout Mode
            </label>
            <select
              value={smartSlice ? "separate" : "stitched"}
              onChange={(e) => setSmartSlice?.(e.target.value === "separate")}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 outline-none"
            >
              {LAYOUT_MODES.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
});

export default UrlInputPanel;
