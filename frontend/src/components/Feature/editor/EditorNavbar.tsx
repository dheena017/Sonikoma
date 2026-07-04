import React from "react";
import {
  Film,
  Settings,
  Sparkles,
  Save,
  Play,
  Activity,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  ChevronDown,
  Monitor,
} from "lucide-react";

interface EditorNavbarProps {
  projectId: string | null;
  seriesTitle: string;
  chapterNumber: string;
  chapterTitle: string;
  onSave: () => void;
  onCompile: () => void;
  isProcessing: boolean;
  isSaving: boolean;
  backendStatus: string;
  isFocusMode: boolean;
  toggleFocusMode: () => void;
  previewQuality: "draft" | "high";
  setPreviewQuality: (q: "draft" | "high") => void;
}

const EditorNavbar = ({
  projectId,
  seriesTitle,
  chapterNumber,
  chapterTitle,
  onSave,
  onCompile,
  isProcessing,
  isSaving,
  backendStatus,
  isFocusMode,
  toggleFocusMode,
  previewQuality,
  setPreviewQuality,
}: EditorNavbarProps) => {
  return (
    <nav className="h-16 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Project Context & History */}
      <div className="flex items-center gap-6 min-w-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] font-mono">
              Pro Editor
            </span>
            <div
              className={`h-1.5 w-1.5 rounded-full ${
                backendStatus === "online"
                  ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  : "bg-rose-500 animate-pulse"
              }`}
            />
          </div>
          <h1 className="text-sm font-bold text-white truncate max-w-[150px] md:max-w-[300px]">
            {seriesTitle || "Untitled Project"}
          </h1>
        </div>

        {/* Undo / Redo (Conceptual Hooks) */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-all disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 hover:bg-white/10 text-neutral-400 hover:text-white rounded-lg transition-all disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Tools & Toggles */}
      <div className="hidden lg:flex items-center gap-4">
        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border ${
            isFocusMode
              ? "bg-purple-600 border-purple-500 text-white"
              : "bg-neutral-900 border-white/5 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          {isFocusMode ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
          {isFocusMode ? "Exit Focus" : "Focus Mode"}
        </button>

        {/* Quality Toggle */}
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-white/5 rounded-xl text-[10px] font-bold text-neutral-400 hover:text-neutral-200 uppercase tracking-wider">
            <Monitor className="w-3.5 h-3.5" />
            {previewQuality === "draft" ? "Draft" : "High"} Res
            <ChevronDown className="w-3 h-3 opacity-50" />
          </button>
          <div className="absolute top-full right-0 mt-2 w-32 bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all overflow-hidden z-50">
            <button
              onClick={() => setPreviewQuality("draft")}
              className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase transition-all ${
                previewQuality === "draft"
                  ? "text-purple-400 bg-purple-500/10"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
              }`}
            >
              Draft Quality
            </button>
            <button
              onClick={() => setPreviewQuality("high")}
              className={`w-full text-left px-4 py-3 text-[10px] font-bold uppercase transition-all ${
                previewQuality === "high"
                  ? "text-purple-400 bg-purple-500/10"
                  : "text-neutral-500 hover:bg-white/5 hover:text-neutral-300"
              }`}
            >
              High Quality
            </button>
          </div>
        </div>
      </div>

      {/* Right: Primary Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-white/10 rounded-xl text-xs font-bold text-neutral-200 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {isSaving ? (
            <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onCompile}
          disabled={isProcessing}
          className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-500/30 rounded-xl text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-purple-950/20 disabled:opacity-50"
        >
          {isProcessing ? (
            <div className="h-3 w-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>Compile Video</span>
        </button>
      </div>
    </nav>
  );
};

export default EditorNavbar;
