import React from "react";
import { Sparkles } from "lucide-react";
import { AI_MODELS } from "../models";
import { NotificationType } from "./NotificationStack";

interface UrlInputPanelProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
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
  return (
    <div id="dynamic_input_box" className="bg-neutral-900/40 rounded-3xl border border-neutral-800/80 p-8 backdrop-blur-md shadow-sm space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">Dynamic Webtoon Scraper</span>
        </div>
        <h2 className="text-lg font-bold text-white tracking-tight">Generate Video from Live Incident URL</h2>
        <p className="text-xs text-neutral-400 font-sans">
          Enter an official Webtoon viewer URL page. The backend engine will scrape the live media assets, isolate panels, run OCR transcriptions, and compile the cinematic rendering dynamically.
        </p>
      </div>

      {/* URL Inputs + Model Selection */}
      <div className="space-y-5">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 opacity-20 blur group-focus-within:opacity-40 transition-opacity duration-300" />
          <input 
            id="target_url_input"
            type="url" 
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isProcessing && targetUrl.trim()) {
                handleGenerateVideo();
              }
            }}
            placeholder="Paste Webtoon episode viewer URL (e.g. webtoons.com/...)"
            className="relative w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-purple-500 transition-colors"
          />
        </div>

        <div className="space-y-3 pt-1">
          <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest font-mono flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-ping"></span>
            Active AI Model Engine (Free Models Recommended)
          </label>
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
                    ? "bg-purple-950/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.12)] text-white"
                    : "bg-neutral-950/40 border-neutral-850/60 hover:border-neutral-750 text-neutral-400 hover:text-neutral-200"
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
