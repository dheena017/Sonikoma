import React from "react";
import {
  FolderOpen,
  Plus,
  Sparkles,
  Volume2,
  Wand2,
  Layers,
  Zap,
  CheckCircle2,
} from "lucide-react";

interface ProjectsPageHeaderProps {
  onNewSeries: () => void;
  stats?: {
    totalProjects: number;
    completedProjects: number;
    totalPanels: number;
  };
}

export default function ProjectsPageHeader({
  onNewSeries,
  stats,
}: ProjectsPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-white/5">
      <div className="space-y-2.5 max-w-2xl">
        {/* Breadcrumb trail */}
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-neutral-500 font-bold uppercase tracking-wider">
            Studio Workspace
          </span>
          <span className="text-neutral-600 font-bold">&rsaquo;</span>
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 font-bold border border-purple-500/20">
            Projects & Series
          </span>
        </div>

        {/* Title & Tag */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/30 group-hover:scale-105 transition-transform">
              <FolderOpen className="h-5 w-5 text-white" />
            </div>
            <span className="absolute -inset-0.5 rounded-2xl border border-purple-500/40 pointer-events-none animate-pulse" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Projects & Series
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                Studio Pro
              </span>
            </h1>
          </div>
        </div>

        <p className="text-neutral-400 text-xs sm:text-sm font-sans max-w-xl">
          Browse, organize, and manage your manga, webtoon, and video storyboard
          productions.
        </p>

        {/* Live Stat Chips */}
        {stats && stats.totalProjects > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-300 text-xs font-mono">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>{stats.totalProjects} Series</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-300 text-xs font-mono">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>{stats.totalPanels.toLocaleString()} Panels</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{stats.completedProjects} Completed</span>
            </span>
          </div>
        )}
      </div>

      {/* Right Quick Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
        <button
          type="button"
          onClick={() =>
            (window as any).navigateTo?.("/creative-suite/ai-voice")
          }
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 hover:border-purple-500/40 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <Volume2 className="h-3.5 w-3.5 text-purple-400" />
          <span>Audio Studio</span>
        </button>

        <button
          type="button"
          onClick={() =>
            (window as any).navigateTo?.("/creative-suite/panel-assistant")
          }
          className="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/10 hover:border-amber-500/40 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
        >
          <Wand2 className="h-3.5 w-3.5 text-amber-400" />
          <span>AI Panel Lab</span>
        </button>

        <button
          type="button"
          onClick={onNewSeries}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-purple-400/30"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Series</span>
        </button>
      </div>
    </div>
  );
}
