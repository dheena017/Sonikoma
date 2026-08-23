import React from "react";
import { Search, Plus, X } from "lucide-react";

interface DashboardHeaderProps {
  themeMode?: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onNewSeries: () => void;
}

export default function DashboardHeader({
  searchQuery,
  onSearchChange,
  onNewSeries,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
      <div className="space-y-3.5 max-w-2xl">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
            Welcome to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-500">
              Sonikoma Studio
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm font-sans leading-relaxed max-w-xl mt-1">
            Convert webtoons and manga into cinematic narrated anime videos with
            OCR speech bubbles and 2.5D camera motions.
          </p>
        </div>

        {/* Floating Search Bar */}
        <div className="relative max-w-md pt-0.5 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-400 group-focus-within:text-purple-300 transition-colors" />
          <input
            type="text"
            placeholder="Search projects, chapters, or series..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-neutral-900/70 border border-white/10 hover:border-purple-500/40 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 rounded-xl py-2.5 pl-10 pr-9 text-xs sm:text-sm text-neutral-100 outline-none font-sans transition-all placeholder:text-neutral-500 backdrop-blur-xl shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right CTA Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onNewSeries}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-purple-900/40 transition-all hover:-translate-y-0.5 cursor-pointer active:scale-95 border border-purple-400/30"
        >
          <Plus className="h-4 w-4 text-white" />
          <span>New Chapter</span>
        </button>
      </div>
    </div>
  );
}
