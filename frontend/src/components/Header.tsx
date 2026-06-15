import React from "react";
import { Film, Menu } from "lucide-react";
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
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  backendStatus: "online" | "offline" | "checking";
}

export default function Header({
  isProcessing,
  panels,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  onToggleSidebar,
  isSidebarOpen = false,
  backendStatus
}: HeaderProps) {
  
  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  return (
    <header id="header_pane" className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div
          className={`flex items-center gap-2 cursor-pointer select-none transition-all duration-300 ${
            isSidebarOpen ? "lg:opacity-0 lg:pointer-events-none" : "lg:opacity-100"
          }`}
          onClick={() => navigateTo("/")}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Film className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-sans">
            Webtoon<span className="text-purple-400">To</span>Video
          </span>
        </div>


      </div>

      {/* Right side controls/status */}
      <div className="flex items-center gap-3">
        {/* Storyboard metrics */}
        {panels.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-neutral-405 bg-neutral-905/30 border border-neutral-800/60 px-3 py-1 rounded-lg select-none">
            <span>panels: <strong className="text-purple-405 font-bold">{panels.length}</strong></span>
            <span className="text-neutral-800 font-bold">|</span>
            <span>est. duration: <strong className="text-purple-405 font-bold">{totalCalculatedDuration.toFixed(1)}s</strong></span>
          </div>
        )}

        {/* Connection status */}
        <div className={`hidden md:flex items-center gap-1.5 font-mono text-[10px] border px-2.5 py-1 rounded-lg select-none ${
          backendStatus === "offline"
            ? "border-rose-900/50 bg-rose-950/20 text-rose-400"
            : "border-neutral-800/80 bg-neutral-900/30 text-neutral-400"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${backendStatus === "offline" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <span>engine: {backendStatus}</span>
        </div>

        {/* Processing status */}
        <div className="flex items-center gap-2 font-mono text-[10px] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg shrink-0">
          <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-purple-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-neutral-300 font-bold">{isProcessing ? "PROCESSING" : "READY"}</span>
        </div>
      </div>
    </header>
  );
}
