import React from "react";
import { Sparkles, Image as ImageIcon } from "lucide-react";
import { AI_MODELS } from "../../models";
import { NotificationType } from "../NotificationStack";
import { extractWebtoonUrl } from "../../utils/url";

const SOURCE_OPTIONS = [
  { id: "webtoons", name: "Webtoons" },
  { id: "webcomicsapp", name: "WebComics App" },
  { id: "mangadex", name: "MangaDex" },
  { id: "toomics", name: "Toomics" },
  { id: "linewebtoon", name: "Line Webtoon" },
  { id: "asurascans", name: "Asura Scans" },
  { id: "manhuato", name: "ManhuaTo" },
  { id: "reaperscans", name: "Reaper Scans" },
  { id: "flamecomics", name: "Flame Comics" },
  { id: "voidscans", name: "Void Scans" },
  { id: "luminousscans", name: "Luminous Scans" },
  { id: "tapas", name: "Tapas" },
  { id: "tappytoon", name: "Tappytoon" },
  { id: "copincomics", name: "Copin Comics" },
  { id: "pocketcomics", name: "Pocket Comics" },
  { id: "lezhin", name: "Lezhin" },
  { id: "bilibilicomics", name: "Bilibili Comics" },
  { id: "mangatoon", name: "MangaToon" },
  { id: "webnovel", name: "Webnovel" },
  { id: "manhuaplus", name: "Manhua Plus" },
  { id: "manhwaclan", name: "Manhwa Clan" },
  { id: "1stkissmanga", name: "1st Kiss Manga" },
  { id: "manganato", name: "Manganato" },
  { id: "mangakakalot", name: "Mangakakalot" },
  { id: "batoto", name: "Bato.to" },
  { id: "custom", name: "Direct Image / Custom URL" },
];

const SOURCE_EXAMPLES: Record<string, string> = {
  webtoons: "webtoons.com/...",
  webcomicsapp: "webcomicsapp.com/...",
  mangadex: "mangadex.org/...",
  toomics: "toomics.com/...",
  linewebtoon: "webtoon.com/...",
  asurascans: "asurascans.com/...",
  manhuato: "manhuato.com/...",
  reaperscans: "reaperscans.com/...",
  flamecomics: "flamecomics.com/...",
  voidscans: "voidscans.com/...",
  luminousscans: "luminousscans.com/...",
  tapas: "tapas.io/...",
  tappytoon: "tappytoon.com/...",
  copincomics: "copincomics.com/...",
  pocketcomics: "pocketcomics.com/...",
  lezhin: "lezhin.com/...",
  bilibilicomics: "bilibilicomics.com/...",
  mangatoon: "mangatoon.mobi/...",
  webnovel: "webnovel.com/...",
  manhuaplus: "manhuaplus.com/...",
  manhwaclan: "manhwaclan.com/...",
  "1stkissmanga": "1stkissmanga.io/...",
  manganato: "manganato.com/...",
  mangakakalot: "mangakakalot.com/...",
  batoto: "bato.to/...",
  custom: "example.com/image.jpg",
};

const SOURCE_DOMAINS: Record<string, string[]> = {
  webtoons: ["webtoons.com", "webtoon.com"],
  webcomicsapp: ["webcomicsapp.com"],
  mangadex: ["mangadex.org", "mangadex.com"],
  toomics: ["toomics.com"],
  linewebtoon: ["webtoon.com"],
  asurascans: ["asurascans.com"],
  manhuato: ["manhuato.com"],
  reaperscans: ["reaperscans.com"],
  flamecomics: ["flamecomics.com", "flamescans.org"],
  voidscans: ["voidscans.com", "void-scans.com"],
  luminousscans: ["luminousscans.com"],
  tapas: ["tapas.io"],
  tappytoon: ["tappytoon.com"],
  copincomics: ["copincomics.com"],
  pocketcomics: ["pocketcomics.com"],
  lezhin: ["lezhin.com", "lezhinus.com"],
  bilibilicomics: ["bilibilicomics.com"],
  mangatoon: ["mangatoon.mobi"],
  webnovel: ["webnovel.com"],
  manhuaplus: ["manhuaplus.com"],
  manhwaclan: ["manhwaclan.com"],
  "1stkissmanga": ["1stkissmanga.io", "1stkissmanga.com"],
  manganato: ["manganato.com", "readmanganato.com"],
  mangakakalot: ["mangakakalot.com"],
  batoto: ["bato.to"],
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
  } = props;

  const source = selectedSource || "webtoons";

  React.useEffect(() => {
    if (!targetUrl.trim()) return;
    try {
      const normalized = extractWebtoonUrl(targetUrl);
      const urlWithScheme = normalized.startsWith("http")
        ? normalized
        : `https://${normalized}`;
      const host = new URL(urlWithScheme).hostname.toLowerCase();

      let foundSource = "custom";
      for (const [srcId, domains] of Object.entries(SOURCE_DOMAINS)) {
        if (srcId === "custom") continue;
        if (
          domains.some(
            (domain) => host === domain || host.endsWith(`.${domain}`)
          )
        ) {
          foundSource = srcId;
          break;
        }
      }
      if (foundSource !== source) {
        setSelectedSource(foundSource);
        console.log(
          `[UrlInputPanel] Auto-detected source site for host "${host}" -> "${foundSource}"`
        );
      }
    } catch {
      // Ignore invalid URL structures during typing
    }
  }, [targetUrl, source, setSelectedSource]);

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData("text") || "";
    const url = pasted.trim();
    if (url) {
      const normalized = extractWebtoonUrl(url);
      console.log("Pasted URL:", url, "Normalized URL:", normalized);
      setTargetUrl(normalized);
      if (normalized !== url) {
        addNotification(
          "Detected duplicate URLs in the paste buffer. Using the first valid URL.",
          "info"
        );
      }
    }
  };

  const selectedSourceName =
    SOURCE_OPTIONS.find((option) => option.id === source)?.name || "Webtoons";
  const targetExample = SOURCE_EXAMPLES[source] || "webtoons.com/...";
  const placeholderText = `Paste ${selectedSourceName} viewer URL (e.g. ${targetExample})`;

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

  const isSourceMismatch = Boolean(
    targetUrl.trim() &&
    !isDirectImage &&
    source !== "custom" &&
    currentHost &&
    !SOURCE_DOMAINS[source]?.some(
      (allowedHost) =>
        currentHost === allowedHost || currentHost.endsWith(`.${allowedHost}`)
    )
  );

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
          Select AI Model Engine...
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
      className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-5 sm:p-6 lg:p-8 backdrop-blur-md shadow-sm space-y-5 sm:space-y-6"
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            Dynamic Webtoon Scraper
          </span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">
          Generate Video from Live Incident URL
        </h2>
        <p className="hidden sm:block text-xs text-neutral-400 font-sans">
          Enter an official Webtoon viewer URL page. The backend engine will
          scrape the live media assets, isolate panels, run OCR transcriptions,
          and compile the cinematic rendering dynamically.
        </p>
      </div>

      {/* URL Inputs + Model Selection */}
      <div className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping" />
              Choose source website
            </label>
            <div className="relative">
              <select
                id="source_select"
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors"
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option
                    key={option.id}
                    value={option.id}
                    className="bg-neutral-950 text-neutral-100"
                  >
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">
                ▾
              </div>
            </div>
          </div>

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
                        `Selected source ${selectedSourceName} does not match the current URL host (${currentHost}). Please choose the correct website or paste a matching URL.`,
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
              disabled={isScraping || !targetUrl.trim() || isSourceMismatch}
              className="relative px-6 py-3.5 bg-purple-600 hover:bg-purple-500 border border-purple-500/50 rounded-xl text-sm font-bold text-white transition-all shadow-[0_0_20px_-5px_rgba(147,51,234,0.5)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 group overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                {isScraping ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Scrape Assets</span>
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Scraping Progress Bar */}
          {isScraping && (
            <div className="space-y-2.5 p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl animate-[fadeIn_0.22s_ease-out] shadow-xl">
              <div className="flex justify-between items-center text-[10px] font-mono text-purple-350 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                  Extracting Webtoon assets
                </span>
                <span>Est. Wait Time: 15-45s</span>
              </div>

              <div className="relative h-2 w-full bg-black/60 rounded-full overflow-hidden border border-purple-950/50 shadow-inner">
                {/* Indeterminate animated progress fill */}
                <div className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 rounded-full w-1/3 animate-infinite-scroll" />
              </div>
              <p className="text-[9.5px] text-neutral-500 font-mono leading-normal">
                Launching headless browser worker on the server backend to extract layout strips.
              </p>
            </div>
          )}

          {/* Series & Chapter Metadata Override Card */}
          <div className="p-4 bg-black/40 border border-neutral-800/80 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                Comic Series & Chapter Metadata
              </span>
              <span className="text-[9px] text-neutral-500 font-bold font-mono">Editable Overrides</span>
            </div>

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
            </div>
          </div>

          {isSourceMismatch && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100 font-mono leading-5 mt-3">
              <strong className="block text-amber-200 mb-1">
                Source mismatch detected
              </strong>
              Selected source <strong>{selectedSourceName}</strong> does not
              match the URL host <strong>{currentHost || "unknown"}</strong>.
              Please choose the correct website or paste a matching URL.
            </div>
          )}
        </div>

        <div className="space-y-3 pt-1">
          {/* Narration Style Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${narrationStyle === "long"
                  ? "bg-purple-500 animate-ping"
                  : "bg-emerald-500 animate-ping"
                  }`}
              />
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
                  ✦ Detailed Recap Narrator (35-70 words/panel · 15+ Min YouTube
                  Videos)
                </option>
                <option
                  value="short"
                  className="bg-neutral-950 text-neutral-100"
                >
                  ✦ Short Subtitle Dialogue (under 25 words/panel · Shorts /
                  Quick Recaps)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">
                ▾
              </div>
            </div>
            <p
              className={`text-[10.5px] font-mono ${narrationStyle === "long"
                ? "text-purple-400/70"
                : "text-emerald-400/70"
                }`}
            >
              {narrationStyle === "long"
                ? "✦ DETAILED RECAP — Generates detailed recap scripts suitable for 10-20 min videos"
                : "✦ SHORT RECAP — Generates shorter dialog lines ideal for shorts and fast pacing"}
            </p>
          </div>

          {/* Scrape Layout Mode Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
              <span
                className={`h-1.5 w-1.5 rounded-full ${smartSlice
                  ? "bg-indigo-500 animate-ping"
                  : "bg-amber-500 animate-ping"
                  }`}
              />
              Scrape Layout Mode
            </label>
            <div className="relative">
              <select
                id="scrape_layout_mode_select"
                value={smartSlice ? "separate" : "stitched"}
                onChange={(e) => {
                  const val = e.target.value === "separate";
                  setSmartSlice?.(val);
                  const label = val
                    ? "Separate Panel Images (Fast Scrape)"
                    : "Single Stitched Strip";
                  addNotification(`Scrape layout mode set to: ${label}`, "info");
                }}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors cursor-pointer"
              >
                <option
                  value="separate"
                  className="bg-neutral-950 text-neutral-100"
                >
                  ✦ Separate Panel Images (Fast Scrape · Under 2s)
                </option>
                <option
                  value="stitched"
                  className="bg-neutral-950 text-neutral-100"
                >
                  ✦ Single Stitched Strip (Takes 15-45s)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">
                ▾
              </div>
            </div>
            <p
              className={`text-[10.5px] font-mono ${smartSlice
                ? "text-indigo-400/70"
                : "text-amber-400/70"
                }`}
            >
              {smartSlice
                ? "✦ SEPARATE IMAGES — Scrapes chapter pages instantly as individual panel cards in storyboard"
                : "✦ SINGLE STITCHED — Stitches all chapter pages together on the backend into a single image"}
            </p>
          </div>

          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
            Active AI Model Engine (Free Models Recommended)
          </label>
          {modelDropdown}

          {selectedModel.includes("pro") && (
            <p className="text-[10.5px] text-amber-500/90 font-mono flex items-center gap-1.5 animate-pulse">
              <span>⚠️</span> Note: Pro models may require billing/credits.
              Flash models (Free) are highly recommended.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
