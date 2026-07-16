import React, { useState, useEffect, useRef } from "react";
import { Loader2, Terminal, Globe, Cpu, RefreshCw, XCircle, ShieldAlert, Sparkles, Image as ImageIcon, Scissors } from "lucide-react";

export type ThemeMode = "dark" | "light";
export type LoadingPageMode = "scrape" | "autocrop";

interface ImageScraperLoadingPageProps {
  targetUrl?: string;
  selectedSource?: string;
  selectedModel?: string;
  consoleLogs: any[];
  onCancel: () => void;
  themeMode?: ThemeMode;
  isFullPage?: boolean;
  /** Whether to show in scrape mode or auto-crop mode */
  mode?: LoadingPageMode;
  /** Optional progress for batch ops: { current, total } */
  progress?: { current: number; total: number } | null;
}


const SCRAPER_TIPS = [
  "Smart Slice uses deep learning to identify borders and automatically segment comic panels.",
  "If a scraper gets blocked, try switching to a different source site or clearing the cache.",
  "Large high-resolution chapters can take up to 45 seconds to download and segment.",
  "Use the Speech Bubble Cleaner after scraping to clean text automatically in the editor.",
  "Stitch adjacent panels in the workspace editor to reconstruct panoramic splash pages.",
  "The auto-crop sensitivity slider helps tune the segmentation threshold for light or dark backgrounds.",
  "AI Models are optimized for manga, manhwa, and webtoon layout splits respectively."
];

const AUTOCROP_TIPS = [
  "Auto Crop uses AI to detect panel borders and slice composite pages into individual frames.",
  "Tall strips are split automatically — adjust Min Panel Height in settings to avoid over-slicing.",
  "Landscape panels are kept intact; only vertical content is sliced by default.",
  "Higher sensitivity catches subtle panel borders but may create more false positives.",
  "After auto-crop, use the Undo button on individual cards to restore the original if needed.",
  "Background Mode controls whether white or dark borders are trimmed from panel edges.",
  "Batch auto-crop processes all selected images concurrently using your configured AI model."
];

export default function ImageScraperLoadingPage({
  targetUrl = "",
  selectedSource = "webtoon",
  selectedModel = "gemini-2.5-flash",
  consoleLogs = [],
  onCancel,
  themeMode,
  mode = "scrape",
  progress = null,
}: ImageScraperLoadingPageProps) {
  const isAutoCrop = mode === "autocrop";
  const tips = isAutoCrop ? AUTOCROP_TIPS : SCRAPER_TIPS;
  const [tipIndex, setTipIndex] = useState(0);
  const [fadeState, setFadeState] = useState<"in" | "out">("in");
  const [activeTheme, setActiveTheme] = useState<ThemeMode>("dark");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    if (themeMode) {
      setActiveTheme(themeMode);
    } else {
      const currentMode = document.documentElement.getAttribute("data-mode") as ThemeMode | null;
      if (currentMode) {
        setActiveTheme(currentMode);
      } else {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setActiveTheme(mq.matches ? "dark" : "light");
      }
    }
  }, [themeMode]);

  // Rotates tips
  useEffect(() => {
    const interval = setInterval(() => {
      setFadeState("out");
      setTimeout(() => {
        setTipIndex((prev) => (prev + 1) % tips.length);
        setFadeState("in");
      }, 500);
    }, 6000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const isLight = activeTheme === "light";

  // Clean URL to display
  const displayUrl = (() => {
    if (!targetUrl) return "N/A";
    try {
      const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
      return parsed.hostname + (parsed.pathname.length > 20 ? parsed.pathname.substring(0, 20) + "..." : parsed.pathname);
    } catch {
      return targetUrl.length > 30 ? targetUrl.substring(0, 30) + "..." : targetUrl;
    }
  })();

  // Parse logs format to render cleanly
  const renderLogMessage = (log: any) => {
    if (!log) return null;
    let message = "";
    let level = "INFO";
    let timeStr = "";

    if (typeof log === "string") {
      message = log;
    } else {
      message = log.message || "";
      level = log.level || "INFO";
      timeStr = log.time || "";
    }

    // Determine colors based on tag prefix or level
    let msgColor = "text-neutral-300";
    let tagColor = "text-purple-400";

    if (message.includes("[ERROR]") || level === "ERROR") {
      msgColor = "text-rose-400";
      tagColor = "text-rose-500 font-bold";
    } else if (message.includes("[WARNING]") || level === "WARNING") {
      msgColor = "text-amber-400";
      tagColor = "text-amber-500";
    } else if (message.startsWith("[Model]")) {
      tagColor = "text-emerald-400 font-bold";
    } else if (message.startsWith("[Import]")) {
      tagColor = "text-cyan-400";
    }

    return (
      <div className="flex items-start font-mono text-[11px] leading-relaxed py-0.5 border-b border-neutral-900/30">
        {timeStr && <span className="text-neutral-600 mr-2 shrink-0 select-none">[{timeStr}]</span>}
        <span className={`${tagColor} shrink-0 mr-1.5 select-none`}>
          {message.startsWith("[") && message.includes("]") ? message.substring(0, message.indexOf("]") + 1) : "⚡"}
        </span>
        <span className={`${msgColor} break-all`}>
          {message.startsWith("[") && message.includes("]") ? message.substring(message.indexOf("]") + 1).trim() : message}
        </span>
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: isLight ? "#f4f4f5" : "#08080c",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        fontFamily: "'Outfit', 'Inter', system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        padding: "16px",
      }}
    >
      {/* Background Glow Elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "20%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: isLight ? "rgba(168, 85, 247, 0.04)" : "rgba(168, 85, 247, 0.06)",
          filter: "blur(120px)",
          pointerEvents: "none",
          animation: "lp-float-bg 12s infinite alternate ease-in-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "20%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: isLight ? "rgba(6, 182, 212, 0.04)" : "rgba(6, 182, 212, 0.06)",
          filter: "blur(120px)",
          pointerEvents: "none",
          animation: "lp-float-bg 12s infinite alternate-reverse ease-in-out",
        }}
      />

      {/* Glass card container */}
      <div
        className="w-full max-w-[620px] rounded-[32px] overflow-hidden flex flex-col relative"
        style={{
          background: isLight ? "rgba(255, 255, 255, 0.8)" : "rgba(12, 12, 18, 0.65)",
          border: isLight ? "1px solid rgba(0, 0, 0, 0.08)" : "1px solid rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
          boxShadow: isLight ? "0 30px 60px rgba(0, 0, 0, 0.05)" : "0 30px 60px rgba(0, 0, 0, 0.4)",
          zIndex: 10,
        }}
      >
        {/* Animated Scanner Header */}
        <div className="relative h-20 w-full overflow-hidden bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-3 z-10">
            <div className="relative p-2 rounded-xl bg-purple-500/10 border border-purple-500/30">
              {isAutoCrop
                ? <Scissors className="h-5 w-5 text-purple-400 animate-pulse" />
                : <RefreshCw className="h-5 w-5 text-purple-400 animate-spin" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                Sonikoma Vision Pipeline
              </h2>
              <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                {isAutoCrop ? "AI Panel Auto‑Crop Engine" : "Episode Crawler & Panel segmenter"}
              </p>
            </div>
          </div>

          <div className="z-10 flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-[10px] font-mono text-purple-400 font-bold">
            <Sparkles className="h-3 w-3 text-purple-300 animate-pulse" />
            {isAutoCrop ? "Auto Cropping" : "Active Scrape"}
          </div>

          {/* Scanner sweeping laser line */}
          <div 
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-80"
            style={{
              animation: "scanner-laser 2.2s infinite ease-in-out",
              boxShadow: "0 0 10px rgba(168, 85, 247, 0.8)",
            }}
          />
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Metadata Display Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-neutral-950/40 border border-neutral-900 rounded-2xl flex flex-col gap-1.5 min-w-0">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Globe className="h-3 w-3 text-cyan-500" /> URL Source
              </span>
              <span className="text-xs font-mono text-white truncate font-bold" title={targetUrl}>
                {displayUrl}
              </span>
            </div>

            <div className="p-3 bg-neutral-950/40 border border-neutral-900 rounded-2xl flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1 font-bold">
                <RefreshCw className="h-3 w-3 text-purple-500" /> {isAutoCrop ? "Mode" : "Website"}
              </span>
              <span className="text-xs font-mono text-white capitalize font-bold">
                {isAutoCrop ? "Batch Slice" : selectedSource}
              </span>
            </div>

            <div className="p-3 bg-neutral-950/40 border border-neutral-900 rounded-2xl flex flex-col gap-1.5">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1 font-bold">
                <Cpu className="h-3 w-3 text-emerald-500" /> {isAutoCrop ? "Progress" : "AI Engine"}
              </span>
              <span className="text-xs font-mono text-white truncate font-bold">
                {isAutoCrop
                  ? progress
                    ? `${progress.current} / ${progress.total}`
                    : "Starting..."
                  : selectedModel.replace("gemini-", "").replace("models/", "")}
              </span>
            </div>
          </div>

          {/* Progress bar for batch ops */}
          {isAutoCrop && progress && progress.total > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                  Slicing panels...
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="relative h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-purple-950/40 shadow-inner">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Terminal Console */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Terminal className="h-3.5 w-3.5 text-neutral-500" />
                Live Log Stream
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_rgba(16,185,129,0.7)]" />
            </div>

            <div className="h-44 rounded-2xl bg-neutral-950 border border-neutral-900 p-4 overflow-y-auto flex flex-col gap-1.5 scrollbar-thin shadow-inner shadow-black/80">
              {consoleLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 gap-2">
                  <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
                  <span className="text-[9px] font-mono text-neutral-400 uppercase font-bold tracking-wider">
                    Establishing connection to vision node...
                  </span>
                </div>
              ) : (
                [...consoleLogs].map((log, idx) => (
                  <React.Fragment key={idx}>
                    {renderLogMessage(log)}
                  </React.Fragment>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>

          {/* Rotating Tips Carousel */}
          <div className="p-4 rounded-2xl bg-purple-950/10 border border-purple-500/10 flex gap-3.5 items-start">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                {isAutoCrop ? "Auto Crop Tip" : "Scraper Pro Tip"}
              </div>
              <div
                className="text-xs text-neutral-300 leading-normal transition-all duration-500 font-medium"
                style={{
                  opacity: fadeState === "in" ? 1 : 0,
                  transform: fadeState === "in" ? "translateY(0)" : "translateY(2px)",
                }}
              >
                {tips[tipIndex]}
              </div>
            </div>
          </div>

          {/* Cancel button */}
          <div className="pt-2 flex justify-center">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 bg-neutral-900 hover:bg-rose-950/20 text-neutral-400 hover:text-rose-400 border border-neutral-800 hover:border-rose-500/30 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 shadow-lg active:scale-98 cursor-pointer"
            >
              <XCircle className="h-4 w-4" />
              {isAutoCrop ? "Cancel Auto Crop" : "Abort Import"}
            </button>
          </div>
        </div>
      </div>

      {/* CSS Keyframe Animations */}
      <style>{`
        @keyframes lp-float-bg {
          0%   { transform: translate(0, 0) scale(1); }
          100% { transform: translate(40px, -40px) scale(1.1); }
        }
        @keyframes scanner-laser {
          0%, 100% { top: 0%; }
          50%      { top: 100%; }
        }
      `}</style>
    </div>
  );
}
