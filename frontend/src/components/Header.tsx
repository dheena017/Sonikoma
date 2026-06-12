import React from "react";
import { Film, Activity, Terminal, Sliders, Scissors, Brain, Keyboard, Sparkles } from "lucide-react";
import { GeneratedPanel } from "../types";

interface HeaderProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
}

export default function Header({
  isProcessing,
  panels,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles
}: HeaderProps) {
  const isDashboard = currentPath === "/" || currentPath === "" || currentPath === "/index.html" || currentPath === "/dashboard";
  const isSettings = currentPath === "/settings";
  const isAutoCrop = currentPath === "/auto-crop";
  const isBubbleCleaner = currentPath === "/bubble-cleaner";
  const isEditor = currentPath.startsWith("/editor");
  const isLogs = currentPath === "/logs";
  const isStatus = currentPath === "/status";
  const isShortcuts = currentPath === "/shortcuts";

  const navRef = React.useRef<HTMLHeadingElement>(null);
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    left: 0,
    width: 0,
    opacity: 0
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  React.useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    // Find active button element
    const activeBtn = nav.querySelector("[data-active='true']") as HTMLButtonElement | null;
    if (activeBtn) {
      setIndicatorStyle({
        left: activeBtn.offsetLeft,
        width: activeBtn.offsetWidth,
        opacity: 1
      });
    } else {
      setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [currentPath, panels.length, editingImageIdx, lastEditorPath, isBatchCropping, isCleaningBubbles]);

  return (
    <header id="header_pane" className="border-b border-neutral-800/80 bg-neutral-950/45 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">

        {/* LOGO */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-opacity self-start lg:self-auto"
          onClick={() => navigateTo("/")}
        >
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Film className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl tracking-tight text-white font-sans">
                Webtoon<span className="text-purple-400">To</span>Video
              </span>

              <span className="text-[10px] px-2 py-0.5 font-mono tracking-wider bg-purple-950 text-purple-400 rounded border border-purple-800">
                REAL-TIME API
              </span>
            </div>
            <p className="text-xs text-neutral-400 font-mono">Senior Orchestrated Vision Pipeline</p>
          </div>
        </div>

        {/* CENTER NAVIGATION PILLS */}
        <nav
          ref={navRef}
          className="nav-scroll-ribbon flex items-center gap-1 bg-neutral-900/60 p-1 rounded-2xl border border-neutral-800/80 w-full lg:w-auto overflow-x-auto relative select-none"
          style={{
            maskImage: "linear-gradient(to right, transparent, #000 12px, #000 calc(100% - 12px), transparent)",
            WebkitMaskImage: "linear-gradient(to right, transparent, #000 12px, #000 calc(100% - 12px), transparent)"
          }}
        >
          {/* Dashboard pill */}
          <button
            onClick={() => navigateTo("/")}
            data-active={isDashboard}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${isDashboard
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
          >
            Dashboard
          </button>

          {/* Auto Crop pill */}
          <button
            onClick={() => navigateTo("/auto-crop")}
            disabled={panels.length === 0}
            data-active={isAutoCrop}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer relative disabled:opacity-35 disabled:cursor-not-allowed ${isAutoCrop
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              } ${isBatchCropping ? "ring-1 ring-cyan-500/50 shadow-[0_0_8px_rgba(34,211,238,0.2)]" : ""}`}
            title="Auto-Crop Settings"
          >
            {isBatchCropping && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            )}
            <Scissors className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Auto-Crop</span>
            {panels.length > 0 && <span className="text-[9px] px-1 bg-black/45 text-neutral-400 rounded-md font-mono">{panels.length}</span>}
          </button>

          {/* Bubble Cleaner pill */}
          <button
            onClick={() => navigateTo("/bubble-cleaner")}
            disabled={panels.length === 0}
            data-active={isBubbleCleaner}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer relative disabled:opacity-35 disabled:cursor-not-allowed ${isBubbleCleaner
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              } ${isCleaningBubbles ? "ring-1 ring-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]" : ""}`}
            title="Bubble Cleaner Settings"
          >
            {isCleaningBubbles && (
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-purple-400 animate-ping" />
            )}
            <Brain className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Clean-Bubbles</span>
          </button>

          {/* Editor pill */}
          <button
            onClick={() => {
              if (lastEditorPath) navigateTo(lastEditorPath);
            }}
            disabled={editingImageIdx === null && !lastEditorPath}
            data-active={isEditor}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${isEditor
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            title="Advanced Crop Editor"
          >
            <Film className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Editor</span>
            {editingImageIdx !== null && <span className="text-[9px] px-1 bg-black/40 text-purple-300 rounded font-mono">#{editingImageIdx + 1}</span>}
          </button>

          {/* Logs pill */}
          <button
            onClick={() => navigateTo("/logs")}
            data-active={isLogs}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${isLogs
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            title="System logs"
          >
            <Terminal className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Logs</span>
          </button>

          {/* Diagnostics Status pill */}
          <button
            onClick={() => navigateTo("/status")}
            data-active={isStatus}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${isStatus
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            title="Backend diagnostics status"
          >
            <Activity className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Status</span>
          </button>

          {/* Key Bindings pill */}
          <button
            onClick={() => navigateTo("/shortcuts")}
            data-active={isShortcuts}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${isShortcuts
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            title="Keyboard Shortcuts Settings"
          >
            <Keyboard className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Keys</span>
          </button>

          {/* AI Suite Dropdown */}
          <div className="relative group">
            <button
              disabled={panels.length === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                currentPath.startsWith("/ai-") || currentPath === "/panel-assistant"
                  ? "text-purple-300 bg-purple-950/20 border border-purple-800"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>AI Suite</span>
              <span className="text-[8px] ml-1">▼</span>
            </button>
            <div className="absolute left-0 mt-1.5 w-48 rounded-xl bg-neutral-900 border border-neutral-805 shadow-2xl p-1 hidden group-hover:block hover:block z-50">
              <button
                onClick={() => navigateTo("/ai-optimizer")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Video Optimizer
              </button>
              <button
                onClick={() => navigateTo("/panel-assistant")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Panel AI Assistant
              </button>
              <button
                onClick={() => navigateTo("/ai-characters")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Character DB
              </button>
              <button
                onClick={() => navigateTo("/ai-translation")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Translation Studio
              </button>
              <button
                onClick={() => navigateTo("/ai-audio-lab")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Sound Design Lab
              </button>
              <button
                onClick={() => navigateTo("/ai-thumbnails")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Thumbnail Studio
              </button>
              <button
                onClick={() => navigateTo("/ai-engagement")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Community Coach
              </button>
              <button
                onClick={() => navigateTo("/ai-voice")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ Voice Studio
              </button>
              <button
                onClick={() => navigateTo("/ai-analytics")}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-mono hover:bg-neutral-800/85 hover:text-white transition-all text-neutral-350 cursor-pointer"
              >
                ✦ CTR Predictor
              </button>
            </div>
          </div>

          {/* Render Settings pill */}
          <button
            onClick={() => navigateTo("/settings")}
            data-active={isSettings}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-mono transition-all duration-200 cursor-pointer ${isSettings
                ? "text-white bg-neutral-800/45 scale-[1.01]"
                : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/20"
              }`}
            title="Advanced Render Settings"
          >
            <Sliders className="h-3 w-3 sm:hidden" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Sliding glow underline indicator */}
          <div
            style={indicatorStyle}
            className="absolute bottom-1 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(168,85,247,0.7)] pointer-events-none"
          />
        </nav>

        {/* RIGHT STATUS INDICATORS */}
        <div className="flex items-center gap-4 self-end lg:self-auto">
          <div className="px-3 py-1.5 rounded-lg border flex items-center gap-2 font-mono border-neutral-800 bg-neutral-900">
            <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-purple-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="text-[11px] text-neutral-300">
              {isProcessing ? "PROCESSING..." : "READY"}
            </span>
          </div>
          {panels.length > 0 && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-neutral-400 font-mono">Total Duration</p>
              <p className="text-sm font-semibold text-white font-mono">{totalCalculatedDuration.toFixed(1)}s Output</p>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
