import React from "react";
import { Search, Plus } from "lucide-react";

interface DashboardHeaderProps {
  themeMode: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewSeries: () => void;
}

export default function DashboardHeader({
  themeMode,
  searchQuery,
  onSearchChange,
  onNewSeries,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
      <div className="w-full max-w-3xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="h-12 w-12 rounded-2xl border border-purple-500/30 bg-black/80 shadow-lg shadow-purple-900/20 object-cover"
              style={{
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
            />
            <span className="absolute -inset-1 rounded-2xl border border-purple-500/40 pointer-events-none" />
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
            Creator Workspace
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl xl:text-5xl font-black tracking-[-0.04em] leading-none text-white mb-4">
          Welcome to{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            Sonikoma
          </span>
        </h1>

        <p className="text-neutral-400 text-sm md:text-base font-mono leading-7 max-w-2xl mb-8">
          Your command center for converting webtoons to stunning narrated
          videos. Manage series, track AI pipeline progress, and start new
          conversions.
        </p>

        <div className="relative max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-500 group-focus-within:text-purple-400 transition-colors" />
          <input
            type="text"
            placeholder="Search your projects or series..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#0b0b0e] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-sans text-neutral-100 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/30 transition-all placeholder:text-neutral-600 shadow-inner shadow-black/35"
          />
        </div>
      </div>

      <div className="flex shrink-0">
        <button
          onClick={onNewSeries}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-purple-400/30"
        >
          <Plus className="h-5 w-5" />
          <span>New Series</span>
        </button>
      </div>
    </div>
  );
}
