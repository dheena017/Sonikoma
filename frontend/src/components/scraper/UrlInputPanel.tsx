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

interface UrlInputPanelProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  selectedSource: string;
  setSelectedSource: (source: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isProcessing: boolean;
  handleGenerateVideo: () => void;
  addNotification: (message: string, type: NotificationType) => void;
}

export default function UrlInputPanel({
  targetUrl,
  setTargetUrl,
  selectedModel,
  setSelectedModel,
  isProcessing,
  handleGenerateVideo,
  addNotification,
}: UrlInputPanelProps) {
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

  const selectedSourceName = SOURCE_OPTIONS.find((source) => source.id === selectedSource)?.name || "Webtoons";
  const targetExample = SOURCE_EXAMPLES[selectedSource] || "webtoons.com/...";
  const placeholderText = `Paste ${selectedSourceName} viewer URL (e.g. ${targetExample})`;

  const modelGrid = (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {AI_MODELS.map((modelItem) => (
        <button
          key={modelItem.id}
          type="button"
          onClick={() => {
            setSelectedModel(modelItem.id);
            addNotification(`Model configured to ${modelItem.name}`, 'info');
          }}
          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between gap-1.5 transition-all duration-300 cursor-pointer ${
            selectedModel === modelItem.id
              ? "bg-purple-950/10 border-transparent shadow-none text-white"
              : "bg-neutral-950/40 border-neutral-850/60 hover:border-neutral-700 text-neutral-300 hover:text-white"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 w-full">
            <span className="text-xs font-semibold whitespace-nowrap truncate">{modelItem.name}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider ${
              modelItem.type === 'free' 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : modelItem.type === 'open-source'
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {modelItem.type}
            </span>
          </div>
          <span className="text-[10px] text-neutral-500 truncate w-full italic font-sans">Powered by {modelItem.provider}</span>
        </button>
      ))}
    </div>
  );

  const duplicateWarning = targetUrl.trim().length > 0 && extractWebtoonUrl(targetUrl) !== targetUrl.trim();

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

          <div className="relative group">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-300" />
            <input 
              id="target_url_input"
              type="url" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value.trim())}
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessing && targetUrl.trim()) {
                  handleGenerateVideo();
                }
              }}
              placeholder={placeholderText}
              className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
        {duplicateWarning && (
          <p className="text-[11px] text-amber-300 font-mono">
            Duplicate or concatenated Webtoon links were detected in the input. The first valid URL is being used.
          </p>
        )}

        <div className="space-y-3 pt-1">
          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
            Active AI Model Engine (Free Models Recommended)
          </label>
          <div className="lg:hidden">
            <details className="rounded-2xl border border-neutral-800/80 bg-neutral-950/30 p-3">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-xs font-bold text-neutral-200 font-mono uppercase tracking-wider select-none">
                <span>Choose model</span>
                <span className="text-[10px] text-neutral-500 normal-case tracking-normal">Tap to expand</span>
              </summary>
              <div className="mt-3">{modelGrid}</div>
            </details>
          </div>

          <div className="hidden lg:block">{modelGrid}</div>

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
