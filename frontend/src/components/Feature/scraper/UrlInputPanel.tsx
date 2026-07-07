import React from "react";
import { Sparkles, Image as ImageIcon, Layout, ArrowRight, Book } from "lucide-react";
import { useAIModels } from "@/hooks/useAIModels";
import { NotificationType } from "../../notification/NotificationStack";
import { extractWebtoonUrl, parseWebtoonUrl } from "../../../utils/url";
import { FavoritesManager } from "../episode-scraper/FavoritesManager";

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
  } = props;

  const [advancedSettingsOpen, setAdvancedSettingsOpen] = React.useState(false);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);

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
      const merged = [...bookmarks, ...reads];
      const uniqueUrls = Array.from(new Set(merged));
      const suggestionsData = uniqueUrls.map(url => {
        const parsed = parseWebtoonUrl(url);
        return {
          url: url,
          title: parsed.episode || parsed.title || "Webtoon Episode",
          genre: parsed.genre || "general",
        };
      });
      setSuggestions(suggestionsData.slice(0, 8));
    } catch (e) {
      console.warn("Failed to load autocomplete suggestions:", e);
    }
  }, [showSuggestions]);

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
    handleScrape?.();
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
            Define your project parameters and source link to begin.
          </p>
        </div>
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
                          src={series.cover_image.startsWith("http") ? `/api/proxy-image?url=${encodeURIComponent(series.cover_image)}` : series.cover_image}
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
        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] font-mono pl-1">
          Source Link
        </label>
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
                setShowSuggestions(false);
              }}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isProcessing && targetUrl.trim()) {
                  handleImportClick();
                }
              }}
              placeholder="Paste any comic or manga viewer URL..."
              className="relative w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-200 outline-none placeholder:text-neutral-700 focus:border-purple-500 transition-all shadow-inner"
            />

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/40">
                  <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                    Recent & Bookmarked Episodes
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-neutral-800/50">
                  {suggestions.map((series, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (series.url) {
                          setTargetUrl(series.url);
                          const parsed = parseWebtoonUrl(series.url);
                          if (setSeriesTitle) setSeriesTitle(parsed.title);
                          if (setScrapedGenre) setScrapedGenre(parsed.genre);
                          if (setChapterNumber) setChapterNumber(parsed.chapterNumber);
                          if (setChapterTitle && parsed.chapterTitle) setChapterTitle(parsed.chapterTitle);
                        }
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2.5 hover:bg-neutral-800/60 flex items-center gap-3 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-neutral-850 rounded-lg flex items-center justify-center border border-neutral-800 flex-shrink-0">
                        <Book className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-xs font-bold text-neutral-200 truncate">
                          {parseWebtoonUrl(series.url).title}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          {series.title}
                        </p>
                        <p className="text-[9px] text-neutral-600 font-mono truncate select-all">
                          {series.url}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {actionSlot || (
            <button
              type="button"
              onClick={handleImportClick}
              disabled={isScraping || !targetUrl.trim()}
              className="relative px-8 py-4 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-2xl text-sm font-bold text-white transition-all shadow-lg active:scale-95 disabled:opacity-50 shrink-0 flex items-center gap-3"
            >
              {isScraping ? (
                "Initializing..."
              ) : (
                <>
                  {" "}
                  <ImageIcon className="h-4 w-4" /> Import Images{" "}
                </>
              )}
            </button>
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
function handleScrape() {
  throw new Error("Function not implemented.");
}
