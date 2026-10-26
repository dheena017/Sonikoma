import React, { useState, useRef } from "react";
import {
  Sparkles,
  Link2,
  UploadCloud,
  Globe,
  X,
  Clipboard,
  ClipboardCheck,
  Play,
  Loader2,
  Check,
  ShieldCheck,
  Zap,
  Film,
  FileUp,
  FileText,
} from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { LandingAnimeScene } from "./LandingAnimeScene";
import { SAMPLE_URLS, getDetectedPlatform } from "../constants";
import type { ThemeMode } from "../types";

export interface LandingHeroProps {
  themeMode?: ThemeMode;
  landingUrl: string;
  setLandingUrl: (url: string) => void;
  onGetStarted: () => void;
  isNavigating: boolean;
}

export function LandingHero({
  themeMode = "dark",
  landingUrl,
  setLandingUrl,
  onGetStarted,
  isNavigating,
}: LandingHeroProps) {
  const isLight = themeMode === "light";
  const [inputTab, setInputTab] = useState<"url" | "upload">("url");
  const [pasteCopied, setPasteCopied] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detectedPlatform = getDetectedPlatform(landingUrl);

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator?.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
          setLandingUrl(text.trim());
          setPasteCopied(true);
          setTimeout(() => setPasteCopied(false), 2000);
        }
      }
    } catch {
      // Fallback if clipboard permission is blocked
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onGetStarted();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <section className="relative pt-14 sm:pt-18 pb-24 sm:pb-32 px-4 sm:px-6 overflow-hidden">
      <LandingAnimeScene themeMode={themeMode} />

      <div className="max-w-5xl mx-auto text-center space-y-6 sm:space-y-8 relative z-10">
        {/* Top Pill Tag */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase border transition-all shadow-sm ${
            isLight
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-blue-500/10 border-blue-500/30 text-blue-400"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span>AI-Powered Comic Video Studio</span>
        </div>

        {/* Main Headline */}
        <h1
          className={`text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.08] max-w-4xl mx-auto transition-colors ${
            isLight ? "text-slate-950" : "text-white"
          }`}
        >
          Bring Your Favorite Comics to Life <br />
          <span
            className={`text-transparent bg-clip-text bg-gradient-to-r ${
              isLight
                ? "from-blue-700 to-slate-900"
                : "from-blue-400 to-blue-500"
            }`}
          >
            One Panel at a Time
          </span>
        </h1>

        {/* Sub-headline */}
        <p
          className={`text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed transition-colors ${
            isLight ? "text-slate-600" : "text-neutral-300"
          }`}
        >
          Turn a chapter link or your own comic images into a vertical video
          with panel-by-panel editing, character voices, and cinematic
          motion—all in one creative workspace.
        </p>

        {/* HERO COMPONENT: ADVANCED OMNIBAR CARD */}
        <div className="pt-2 sm:pt-4 max-w-3xl lg:max-w-4xl mx-auto w-full text-left relative">
          <div
            className={`relative rounded-[30px] border transition-all duration-300 p-4 sm:p-6 backdrop-blur-2xl shadow-[0_24px_70px_rgba(0,0,0,0.38)] space-y-4 ${
              isLight
                ? "bg-white/95 border-slate-200/90 shadow-slate-200/60"
                : "bg-[#181818] border-[#2F2F2F] shadow-xl"
            }`}
          >
            {/* Mode Selector Tabs (URL vs Upload) */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setInputTab("url")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputTab === "url"
                      ? isLight
                        ? "bg-white text-blue-700 shadow-xs"
                        : "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Chapter Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputTab("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    inputTab === "upload"
                      ? isLight
                        ? "bg-white text-blue-700 shadow-xs"
                        : "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : isLight
                      ? "text-slate-600 hover:text-slate-900"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Files</span>
                </button>
              </div>

              <span
                className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                  isLight ? "text-slate-500" : "text-neutral-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Supports MangaDex, Webtoon, Tapas
              </span>
            </div>

            {/* TAB 1: URL INPUT MODE */}
            {inputTab === "url" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full">
                  <div
                    className={`flex items-center gap-2.5 flex-1 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl border transition-all duration-200 ${
                      isLight
                        ? "bg-slate-50/90 border-slate-300 focus-within:border-blue-600 focus-within:bg-white focus-within:ring-3 focus-within:ring-blue-500/15"
                        : "bg-[#141414] border-[#2F2F2F] hover:border-[#383838] focus-within:border-blue-500 focus-within:ring-3 focus-within:ring-blue-500/25"
                    }`}
                  >
                    {/* Globe / Link Icon */}
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isLight
                          ? "bg-blue-50 text-blue-600"
                          : "bg-blue-500/10 text-blue-400"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                    </div>

                    {/* Text Input */}
                    <input
                      type="url"
                      placeholder="Paste comic link (e.g. MangaDex, Webtoon chapter)..."
                      value={landingUrl}
                      onChange={(e) => setLandingUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={`flex-1 bg-transparent outline-none text-xs sm:text-sm min-w-0 font-medium ${
                        isLight
                          ? "text-slate-900 placeholder:text-slate-400"
                          : "text-white placeholder:text-neutral-500"
                      }`}
                    />

                    {/* Detected Platform Badge */}
                    {detectedPlatform && (
                      <span
                        className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 animate-in fade-in zoom-in-95 duration-200 ${detectedPlatform.tagClass}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {detectedPlatform.name}
                      </span>
                    )}

                    {/* Clear Button */}
                    {landingUrl && (
                      <Tooltip text="Clear input" placement="top">
                        <button
                          type="button"
                          onClick={() => setLandingUrl("")}
                          className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                          aria-label="Clear URL input"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    )}

                    {/* Quick Clipboard Paste Button */}
                    {!landingUrl && (
                      <Tooltip text="Paste link from clipboard" placement="top">
                        <button
                          type="button"
                          onClick={handlePasteFromClipboard}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer shrink-0 ${
                            pasteCopied
                              ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                              : isLight
                              ? "bg-slate-200/80 hover:bg-slate-300 border-slate-300 text-slate-700"
                              : "bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300 hover:text-white"
                          }`}
                        >
                          {pasteCopied ? (
                            <>
                              <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
                              <span>Pasted!</span>
                            </>
                          ) : (
                            <>
                              <Clipboard className="w-3.5 h-3.5 text-neutral-400" />
                              <span className="hidden sm:inline">Paste</span>
                            </>
                          )}
                        </button>
                      </Tooltip>
                    )}
                  </div>

                  {/* Primary CTA Action Button */}
                  <Tooltip
                    text="Start AI panel slicing and video generation"
                    placement="top"
                  >
                    <button
                      disabled={isNavigating}
                      onClick={onGetStarted}
                      className="group relative inline-flex items-center justify-center gap-2.5 h-12 px-6 sm:px-8 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-60 text-white font-bold text-sm rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer shrink-0 select-none shadow-lg shadow-blue-500/25"
                    >
                      {isNavigating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-3 h-3 fill-white text-white ml-0.5" />
                          </div>
                          <span>Create Video</span>
                        </>
                      )}
                    </button>
                  </Tooltip>
                </div>

                {/* Sample Comics Quick-Picker Chips */}
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`text-xs font-bold mr-1 flex items-center gap-1.5 ${
                      isLight ? "text-slate-700" : "text-neutral-300"
                    }`}
                  >
                    <span>Try sample comics:</span>
                  </span>

                  {SAMPLE_URLS.map((sample) => {
                    const isSelected = landingUrl === sample.url;
                    return (
                      <Tooltip
                        key={sample.name}
                        text={`Load sample: ${sample.name} (${sample.tag})`}
                        placement="bottom"
                      >
                        <button
                          type="button"
                          onClick={() => setLandingUrl(sample.url)}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer select-none active:scale-95 ${
                            isSelected
                              ? isLight
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm -translate-y-0.5"
                                : "bg-blue-600/30 text-blue-200 border-blue-400 shadow-sm -translate-y-0.5"
                              : isLight
                              ? "bg-slate-100 hover:bg-blue-50 border-slate-300 hover:border-blue-300 text-slate-800 hover:text-blue-700"
                              : "bg-[#141414] hover:bg-[#2A2A2A] border-[#2F2F2F] hover:border-blue-500/40 text-neutral-300 hover:text-white"
                          }`}
                        >
                          <span className="text-sm leading-none">
                            {sample.icon}
                          </span>
                          <span>{sample.name}</span>
                          {isSelected && (
                            <Check className="w-3 h-3 text-blue-300 ml-0.5" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: UPLOAD FILES MODE */}
            {inputTab === "upload" && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.cbz,.zip,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-blue-500 bg-blue-500/10 scale-[1.01]"
                      : isLight
                      ? "border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30"
                      : "border-[#2F2F2F] hover:border-blue-500/50 bg-[#141414] hover:bg-[#1a1a1a]"
                  }`}
                >
                  {selectedFile ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white truncate max-w-xs">
                            {selectedFile.name}
                          </div>
                          <div className="text-xs text-neutral-400">
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to process
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                          }}
                          className="h-10 px-4 rounded-xl bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 text-xs font-bold text-white transition-all cursor-pointer inline-flex items-center justify-center"
                        >
                          Remove
                        </button>
                        <button
                          type="button"
                          disabled={isNavigating}
                          onClick={(e) => {
                            e.stopPropagation();
                            onGetStarted();
                          }}
                          className="h-10 px-5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all active:scale-95 inline-flex items-center justify-center cursor-pointer"
                        >
                          Process Chapter
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
                        <FileUp className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">
                          Drop your comic images, CBZ, ZIP, or PDF here
                        </span>
                        <span className="text-xs text-neutral-400 block mt-0.5">
                          or click to browse from your device (up to 250MB)
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        {["PNG", "JPEG", "WebP", "CBZ", "ZIP", "PDF"].map((ext) => (
                          <span
                            key={ext}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-neutral-400"
                          >
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Value Proof Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-5 text-xs font-semibold">
            <span
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
                isLight
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>No credit card required</span>
            </span>

            <span
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
                isLight
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-400"
              }`}
            >
              <Zap className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Creator-controlled from start to finish</span>
            </span>

            <span
              className={`hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all ${
                isLight
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-blue-500/10 border-blue-500/20 text-blue-300"
              }`}
            >
              <Film className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Made for TikTok, Shorts & Reels</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
