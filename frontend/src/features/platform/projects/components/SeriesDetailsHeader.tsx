import React from "react";
import {
  FolderOpen,
  ArrowLeft,
  Plus,
  Edit3,
  Star,
  Volume2,
  Clock,
  Layers,
  BookOpen,
} from "lucide-react";
import type { Series } from "@/features/platform/projects/types";

interface SeriesDetailsHeaderProps {
  series: Series;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenEditModal: () => void;
  onNavigateBack: () => void;
  onNewChapter: () => void;
  onNavigateAudioStudio: () => void;
}

export default function SeriesDetailsHeader({
  series,
  isFavorite,
  onToggleFavorite,
  onOpenEditModal,
  onNavigateBack,
  onNewChapter,
  onNavigateAudioStudio,
}: SeriesDetailsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#262626] bg-gradient-to-b from-[#181818] via-[#141414] to-[#101010] p-5 sm:p-6 lg:p-7 shadow-xl">
      {/* Decorative ambient background glow */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Cover Poster with subtle zoom & glass badge */}
        <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-xl border border-[#2F2F2F] bg-neutral-950 sm:w-44 shadow-2xl shadow-black/80 group">
          {series.cover ? (
            <img
              src={series.cover}
              alt={series.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#101010]">
              <FolderOpen className="h-10 w-10 text-neutral-600" />
              <span className="text-[10px] font-semibold uppercase text-neutral-500">
                No Cover
              </span>
            </div>
          )}
          <div className="absolute left-2.5 top-2.5 rounded-lg bg-black/75 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-neutral-200 border border-white/10 shadow-xs">
            SERIES COVER
          </div>
        </div>

        {/* Series Meta Info & Actions */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left Column: Genre, Author, Title, Synopsis */}
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-[#3B82F6] flex items-center gap-1.5 shadow-xs">
                  <BookOpen className="w-3.5 h-3.5" />
                  {series.genre || "Fantasy Action"}
                </span>
                <span className="rounded-lg border border-[#2F2F2F] bg-[#141414] px-3 py-1 text-xs font-medium text-neutral-300 shadow-xs">
                  By {series.author || "Unknown Author"}
                </span>
                <span className="rounded-lg border border-[#282828] bg-[#141414] px-2.5 py-1 text-xs font-semibold text-neutral-400 flex items-center gap-1.5 shadow-xs">
                  <Layers className="w-3.5 h-3.5 text-[#3B82F6]" />
                  {series.chapterCount} {series.chapterCount === 1 ? "Chapter" : "Chapters"}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl font-sans">
                {series.title}
              </h1>

              {series.synopsis && (
                <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                  {series.synopsis}
                </p>
              )}
            </div>

            {/* Right Column: Actions Toolbar with Back Button, Favorite, and Edit Info */}
            <div className="flex items-center gap-2 shrink-0 pt-0.5 flex-wrap">
              {/* Back to Projects Button moved here into header card */}
              <button
                type="button"
                onClick={onNavigateBack}
                className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[#2F2F2F] bg-[#141414] px-3.5 text-xs font-bold text-neutral-300 transition-all hover:bg-[#2A2A2A] hover:border-neutral-500 hover:text-white group cursor-pointer select-none active:scale-95 shadow-sm"
                aria-label="Back to Projects"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white group-hover:-translate-x-0.5 transition-transform" />
                <span>Projects</span>
              </button>

              {/* Favorite Button */}
              <button
                type="button"
                onClick={onToggleFavorite}
                aria-pressed={isFavorite}
                className={`flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold transition-all cursor-pointer select-none active:scale-95 shadow-sm ${
                  isFavorite
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-[#141414] border-[#2F2F2F] text-neutral-300 hover:text-white hover:bg-[#2A2A2A] hover:border-neutral-500"
                }`}
              >
                <Star
                  className={`w-3.5 h-3.5 ${
                    isFavorite ? "fill-amber-400 text-amber-400" : ""
                  }`}
                />
                <span>{isFavorite ? "Favorited" : "Favorite"}</span>
              </button>

              {/* Edit Info Button */}
              <button
                type="button"
                onClick={onOpenEditModal}
                className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[#2F2F2F] bg-[#141414] px-3.5 text-xs font-bold text-white transition-all hover:bg-[#2A2A2A] hover:border-neutral-500 cursor-pointer select-none active:scale-95 shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                <span>Edit Info</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span>
              Updated{" "}
              {series.latestUpdatedAt
                ? new Date(series.latestUpdatedAt).toLocaleDateString()
                : "recently"}
            </span>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-3 border-t border-[#262626] pt-4.5">
            <button
              onClick={onNewChapter}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] px-5 text-sm font-bold text-white transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/35 cursor-pointer active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>New chapter</span>
            </button>

            <button
              onClick={onNavigateAudioStudio}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2F2F2F] bg-[#141414] px-4.5 text-sm font-bold text-white transition-all hover:bg-[#2A2A2A] hover:border-neutral-500 cursor-pointer active:scale-95 shadow-sm"
            >
              <Volume2 className="h-4 w-4 text-[#3B82F6]" />
              <span>Audio Studio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
