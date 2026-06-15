import React from "react";
import { Sparkles } from "lucide-react";
import { AI_MODELS } from "../../models";
import { NotificationType } from "../NotificationStack";
import { extractWebtoonUrl } from "../../utils/url";

const SOURCE_OPTIONS = [
  { id: "webtoons", name: "Webtoons" },
  { id: "webcomicsapp", name: "WebComics App" },
  { id: "mangadex", name: "MangaDex" },
  { id: "toomics", name: "Toomics" },
  { id: "linewebtoon", name: "Line Webtoon" },
];

const SOURCE_EXAMPLES: Record<string, string> = {
  webtoons: "webtoons.com/...",
  webcomicsapp: "webcomicsapp.com/...",
  mangadex: "mangadex.org/...",
  toomics: "toomics.com/...",
  linewebtoon: "webtoon.com/...",
};

const SOURCE_DOMAINS: Record<string, string[]> = {
  webtoons: ["webtoons.com", "webtoon.com"],
  webcomicsapp: ["webcomicsapp.com"],
  mangadex: ["mangadex.org", "mangadex.com"],
  toomics: ["toomics.com"],
  linewebtoon: ["webtoon.com"],
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
  } = props;

  const source = selectedSource || 'webtoons';

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData('text') || '';
    const url = pasted.trim();
    if (url) {
      const normalized = extractWebtoonUrl(url);
      console.log('Pasted URL:', url, 'Normalized URL:', normalized);
      setTargetUrl(normalized);
      if (normalized !== url) {
        addNotification(
          'Detected duplicate URLs in the paste buffer. Using the first valid URL.',
          'info'
        );
      }
    }
  };

  const selectedSourceName = SOURCE_OPTIONS.find((option) => option.id === source)?.name || "Webtoons";
  const targetExample = SOURCE_EXAMPLES[source] || "webtoons.com/...";
  const placeholderText = `Paste ${selectedSourceName} viewer URL (e.g. ${targetExample})`;

  const currentHost = (() => {
    try {
      const normalized = extractWebtoonUrl(targetUrl);
      const urlWithScheme = normalized.startsWith('http') ? normalized : `https://${normalized}`;
      return new URL(urlWithScheme).hostname.toLowerCase();
    } catch {
      return "";
    }
  })();

  const isSourceMismatch = Boolean(
    targetUrl.trim() &&
    currentHost &&
    !SOURCE_DOMAINS[source]?.some((allowedHost) =>
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
          const selectedName = AI_MODELS.find(m => m.id === e.target.value)?.name || e.target.value;
          console.log(`[UrlInputPanel] Model changed to: ${e.target.value} (${selectedName})`);
          addNotification(`Model configured to ${selectedName}`, 'info');
        }}
        className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none appearance-none focus:border-purple-500 transition-colors cursor-pointer"
      >
        <option value="" disabled>Select AI Model Engine...</option>
        {AI_MODELS.map((modelItem) => (
          <option key={modelItem.id} value={modelItem.id} className="bg-neutral-950 text-neutral-100">
            {modelItem.name} ({modelItem.provider} - {modelItem.type})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-neutral-500 select-none">▾</div>
    </div>
  );

  return (
    <div id="dynamic_input_box" className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-5 sm:p-6 lg:p-8 backdrop-blur-md shadow-sm space-y-5 sm:space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">Dynamic Webtoon Scraper</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Generate Video from Live Incident URL</h2>
        <p className="hidden sm:block text-xs text-neutral-400 font-sans">
          Enter an official Webtoon viewer URL page. The backend engine will scrape the live media assets, isolate panels, run OCR transcriptions, and compile the cinematic rendering dynamically.
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
                  <option key={option.id} value={option.id} className="bg-neutral-950 text-neutral-100">
                    {option.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-500 select-none">▾</div>
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
                  if (e.key === 'Enter' && !isProcessing && targetUrl.trim()) {
                    console.log("[UrlInputPanel] Enter key pressed. Triggering generation.");
                    if (isSourceMismatch) {
                      addNotification(
                        `Selected source ${selectedSourceName} does not match the current URL host (${currentHost}). Please choose the correct website or paste a matching URL.`,
                        'error'
                      );
                      return;
                    }
                    handleGenerateVideo();
                  }
                }}
                placeholder={placeholderText}
                className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleScrape}
              disabled={isScraping || !targetUrl.trim() || isSourceMismatch}
              className="relative px-6 py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl text-sm font-bold text-white transition-all hover:border-purple-500/50 hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed group overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                {isScraping ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    <span>Scraping...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                    <span>Scrape Assets</span>
                  </>
                )}
              </span>
            </button>
          </div>
            {isSourceMismatch && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[11px] text-amber-100 font-mono leading-5 mt-3">
                <strong className="block text-amber-200 mb-1">Source mismatch detected</strong>
                Selected source <strong>{selectedSourceName}</strong> does not match the URL host <strong>{currentHost || 'unknown'}</strong>. Please choose the correct website or paste a matching URL.
              </div>
            )}
        </div>

        <div className="space-y-3 pt-1">
          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
            Active AI Model Engine (Free Models Recommended)
          </label>
          {modelDropdown}

          {selectedModel.includes('pro') && (
            <p className="text-[10.5px] text-amber-500/90 font-mono flex items-center gap-1.5 animate-pulse">
              <span>⚠️</span> Note: Pro models may require billing/credits. Flash models (Free) are highly recommended.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
