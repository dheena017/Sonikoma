import React from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { AI_MODELS } from "../../models";
import { NotificationType } from "../NotificationStack";
import { extractWebtoonUrl } from "../../utils/url";

const SOURCE_OPTIONS = [
  { id: "custom", name: "Direct Image / Custom URL" },
];

const SOURCE_EXAMPLES: Record<string, string> = {
  custom: "example.com/comic/chapter-1",
};

const SOURCE_DOMAINS: Record<string, string[]> = {
  custom: [],
};

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
}

export default function UrlInputPanel(props: UrlInputPanelProps) {
  const {
    targetUrl,
    setTargetUrl,
    selectedSource,
    setSelectedSource,
    selectedModel,
    setSelectedModel,
    isProcessing,
    isScraping = false,
    handleGenerateVideo,
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
    handleSaveMeta,
  } = props;

  // Metadata card is hidden until the user clicks Scrape Assets
  const [metadataRevealed, setMetadataRevealed] = React.useState(false);
  const [metadataCollapsed, setMetadataCollapsed] = React.useState(true);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = React.useState(false);

  // Reveal the card as soon as scraping starts
  React.useEffect(() => {
    if (isScraping) {
      setMetadataRevealed(true);
    }
  }, [isScraping]);

  const source = selectedSource || "webtoons";

  React.useEffect(() => {
    // URL host detection removed since we allow all URLs now.
    if (source !== "custom") {
      setSelectedSource("custom");
    }
  }, [targetUrl, source, setSelectedSource]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData("text") || "";
    const url = pasted.trim();
    if (url) {
      const normalized = extractWebtoonUrl(url);
      console.log("Pasted URL:", url, "Normalized URL:", normalized);

      if (normalized !== targetUrl && resetWorkspace) {
        resetWorkspace();
      }

      setTargetUrl(normalized);
      if (normalized !== url) {
        addNotification(
          "Detected duplicate URLs in the paste buffer. Using the first valid URL.",
          "info"
        );
      }
    }
  };

  const placeholderText = `Paste any comic or manga viewer URL (e.g. ${SOURCE_EXAMPLES.custom})`;

  const currentHost = (() => {
    try {
      const normalized = extractWebtoonUrl(targetUrl);
      const urlWithScheme = normalized.startsWith("http")
        ? normalized
        : `https://${normalized}`;
      return new URL(urlWithScheme).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const isDirectImage = Boolean(
    targetUrl.trim() &&
      (targetUrl
        .toLowerCase()
        .match(/\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff)(\?|$)/) ||
        targetUrl.startsWith("data:image/"))
  );

  const isSourceMismatch = false;

  const modelDropdown = (
    <div className="relative">
      <select
        id="model_select"
        value={selectedModel}
        onChange={(e) => {
          setSelectedModel(e.target.value);
          const selectedName =
            AI_MODELS.find((m) => m.id === e.target.value)?.name ||
            e.target.value;
          console.log(
            `[UrlInputPanel] Model changed to: ${e.target.value} (${selectedName})`
          );
          addNotification(`Model configured to ${selectedName}`, "info");
        }}
        className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors cursor-pointer"
      >
        <option value="" disabled>
          Select Voice Engine...
        </option>
        {AI_MODELS.map((modelItem) => (
          <option
            key={modelItem.id}
            value={modelItem.id}
            className="bg-neutral-950 text-neutral-100"
          >
            {modelItem.name} ({modelItem.provider} - {modelItem.type})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500 select-none">
        ▾
      </div>
    </div>
  );

  return (
    <div
      id="dynamic_input_box"
      className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-5 sm:p-6 lg:p-8 backdrop-blur-md shadow-sm space-y-5 sm:space-y-6 min-w-0 w-full overflow-hidden"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase font-mono">
            Quick Link Importer
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight">
          Turn a Link into a Video
        </h2>
        <p className="text-[10px] sm:text-xs text-neutral-400 font-sans leading-relaxed">
          Paste a link to any comic or manga chapter to get started.
        </p>
      </div>

      {/* URL Inputs + Model Selection */}
      <div className="space-y-5">
        <div className="space-y-4">


          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group flex-grow">
              <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-300" />
              <input
                id="target_url_input"
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isProcessing && targetUrl.trim()) {
                    console.log(
                      "[UrlInputPanel] Enter key pressed. Triggering asset scraper."
                    );
                    if (isSourceMismatch) {
                      addNotification(
                        `Invalid URL host.`,
                        "error"
                      );
                      return;
                    }
                    handleScrape?.();
                  }
                }}
                placeholder={placeholderText}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={() => handleScrape?.()}
              disabled={isScraping || !targetUrl.trim()}
              className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 group overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                {isScraping ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Import Images</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Scraping Progress Bar */}
          {isScraping && (
            <div className="space-y-2.5 p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-[fadeIn_0.22s_ease-out] shadow-xl">
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-neutral-500" />
                  Getting images from the link
                </span>
                <span>Est. Wait Time: 15-45s</span>
              </div>

              <div className="relative h-2 w-full bg-black/60 rounded-full overflow-hidden border border-neutral-800/50 shadow-inner">
                {/* Indeterminate animated progress fill */}
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-neutral-600 via-neutral-500 to-neutral-400 rounded-full w-1/3 animate-infinite-scroll" />
              </div>
              <p className="text-[9.5px] text-neutral-500 font-mono leading-normal">
                We are downloading the images so you can turn them into a video.
              </p>
            </div>
          )}

          {/* Series & Chapter Metadata Override Card — revealed after scrape */}
          {metadataRevealed && (
            <div
              className="border rounded-2xl overflow-hidden transition-all duration-500"
              style={{
                borderColor: isScraping
                  ? "rgba(63,63,70,0.8)"
                  : "rgba(63,63,70,0.8)",
                background: isScraping
                  ? "rgba(0,0,0,0.4)"
                  : "rgba(0,0,0,0.4)",
                animation: "slideDown 0.4s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              {/* Card Header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b cursor-pointer select-none"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
                onClick={() => setMetadataCollapsed((v) => !v)}
              >
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isScraping ? "bg-neutral-400" : "bg-emerald-500"
                    }`}
                  />
                  Comic Series &amp; Chapter Metadata
                  {isScraping ? (
                    <span className="ml-1.5 text-[9px] text-neutral-400 font-mono">
                      Auto-filling...
                    </span>
                  ) : (
                    <span className="ml-1.5 text-[9px] text-emerald-400 font-mono">
                      ✓ Scraped
                    </span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-neutral-500 font-bold font-mono">
                    Editable Overrides
                  </span>
                  <span
                    className="text-neutral-500 text-[10px] transition-transform duration-300"
                    style={{
                      display: "inline-block",
                      transform: metadataCollapsed
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    ▾
                  </span>
                </div>
              </div>

              {/* Collapsible Fields */}
              {!metadataCollapsed && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Series Name */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Comic/Manhwa Series Title
                      </label>
                      <input
                        type="text"
                        value={seriesTitle}
                        onChange={(e) => setSeriesTitle?.(e.target.value)}
                        placeholder="e.g. Boundless Necromancer"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors"
                      />
                    </div>

                    {/* Genre */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Genre / Category
                      </label>
                      <input
                        type="text"
                        value={scrapedGenre}
                        onChange={(e) => setScrapedGenre?.(e.target.value)}
                        placeholder="e.g. Fantasy Action"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors"
                      />
                    </div>

                    {/* Chapter Number */}
                    <div className="md:col-span-4 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Chapter / Episode Number
                      </label>
                      <input
                        type="text"
                        value={chapterNumber}
                        onChange={(e) => setChapterNumber?.(e.target.value)}
                        placeholder="e.g. 72"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors font-mono"
                      />
                    </div>

                    {/* Chapter Title */}
                    <div className="md:col-span-8 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Chapter Title / Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={chapterTitle}
                        onChange={(e) => setChapterTitle?.(e.target.value)}
                        placeholder="e.g. The S-Rank Awakens"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors"
                      />
                    </div>

                    {/* Author / Illustrator */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Author / Illustrator
                      </label>
                      <input
                        type="text"
                        value={seriesAuthor}
                        onChange={(e) => setSeriesAuthor?.(e.target.value)}
                        placeholder="e.g. Chugong, DUBU"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors"
                      />
                    </div>

                    {/* Cover Image URL */}
                    <div className="md:col-span-6 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Series Cover Image URL (Optional)
                      </label>
                      <input
                        type="text"
                        value={seriesCoverImage}
                        onChange={(e) => setSeriesCoverImage?.(e.target.value)}
                        placeholder="e.g. https://example.com/cover.jpg"
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors"
                      />
                    </div>

                    {/* Synopsis / Description */}
                    <div className="md:col-span-12 space-y-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                        Series Synopsis / Description (Optional)
                      </label>
                      <textarea
                        value={seriesSynopsis}
                        onChange={(e) => setSeriesSynopsis?.(e.target.value)}
                        placeholder="Describe the series storyline..."
                        rows={2}
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-neutral-200 outline-none transition-colors resize-none font-sans"
                      />
                    </div>
                    
                    {handleSaveMeta && (
                      <div className="md:col-span-12 flex justify-end mt-1">
                        <button
                          type="button"
                          onClick={handleSaveMeta}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 text-white text-[10px] font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          Save Meta
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ADVANCED SETTINGS TOGGLE */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setAdvancedSettingsOpen(!advancedSettingsOpen)}
            className="flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-white transition-colors"
          >
            <span
              className="transition-transform duration-300"
              style={{
                display: "inline-block",
                transform: advancedSettingsOpen ? "rotate(90deg)" : "rotate(0deg)",
              }}
            >
              ▸
            </span>
            Advanced Settings (Model, Layout, Narration)
          </button>
        </div>

        {/* ADVANCED SETTINGS CONTENT */}
        {advancedSettingsOpen && (
          <div className="space-y-4 pt-3 border-t border-neutral-800/50 animate-in fade-in slide-in-from-top-2">
            {/* Narration Style Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
              AI Narration Style
            </label>
            <div className="relative">
              <select
                id="narration_style_select"
                value={narrationStyle}
                onChange={(e) => {
                  setNarrationStyle?.(e.target.value);
                  const label =
                    e.target.value === "long"
                      ? "Detailed Recap Narrator"
                      : "Short Subtitle Dialogue";
                  addNotification(`Narration mode set to: ${label}`, "info");
                }}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option
                  value="long"
                  className="bg-neutral-950 text-neutral-100"
                >
                  Detailed Recap Narrator (35-70 words/panel · 15+ Min YouTube
                  Videos)
                </option>
                <option
                  value="short"
                  className="bg-neutral-950 text-neutral-100"
                >
                  Short Subtitle Dialogue (under 25 words/panel · Shorts /
                  Quick Recaps)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">
                ▾
              </div>
            </div>
            <p
              className={`text-[10.5px] font-mono ${
                narrationStyle === "long"
                  ? "text-purple-400/70"
                  : "text-emerald-400/70"
              }`}
            >
              {narrationStyle === "long"
                ? "DETAILED RECAP — Generates detailed recap scripts suitable for 10-20 min videos"
                : "SHORT RECAP — Generates shorter dialog lines ideal for shorts and fast pacing"}
            </p>
          </div>

          {/* Scrape Layout Mode Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
              Import Layout Mode
            </label>
            <div className="relative">
              <select
                id="scrape_layout_mode_select"
                value={smartSlice ? "separate" : "stitched"}
                onChange={(e) => {
                  const val = e.target.value === "separate";
                  setSmartSlice?.(val);
                  const label = val
                    ? "Separate Panel Images (Fast Import)"
                    : "Single Stitched Strip";
                  addNotification(
                    `Import layout mode set to: ${label}`,
                    "info"
                  );
                }}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option
                  value="separate"
                  className="bg-neutral-950 text-neutral-100"
                >
                  Separate Panel Images (Fast Import · Under 2s)
                </option>
                <option
                  value="stitched"
                  className="bg-neutral-950 text-neutral-100"
                >
                  Single Stitched Strip (Takes 15-45s)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">
                ▾
              </div>
            </div>
            <p
              className={`text-[10.5px] font-mono ${
                smartSlice ? "text-indigo-400/70" : "text-amber-400/70"
              }`}
            >
              {smartSlice
                ? "SEPARATE IMAGES — Imports chapter pages instantly as individual panel cards in the timeline"
                : "SINGLE STITCHED — Stitches all chapter pages together on the backend into a single image"}
            </p>
          </div>

          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
            Active Model (Free Models Recommended)
          </label>
          {modelDropdown}

          {selectedModel.includes("pro") && (
            <p className="text-[10.5px] text-amber-500/90 font-mono flex items-center gap-1.5">
              <span>⚠️</span> Note: Pro models may require billing/credits.
              Flash models (Free) are highly recommended.
            </p>
          )}
          </div>
        )}
      </div>
    </div>
  );
}
