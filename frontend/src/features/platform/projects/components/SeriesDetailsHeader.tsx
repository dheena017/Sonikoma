import React from "react";
import {
  FolderOpen,
  ArrowLeft,
  Plus,
  Edit3,
  Star,
  Volume2,
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
    <>
      {/* Top Back Nav & Quick Toolbar */}
      <div className="flex flex-col gap-3 border-b border-[#2F2F2F] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <button
            type="button"
            onClick={onNavigateBack}
            className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[#2F2F2F] bg-[#141414] px-3 text-neutral-400 transition-colors hover:bg-[#2A2A2A] hover:text-white group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Projects</span>
          </button>
          <span className="text-neutral-600 font-bold">&rsaquo;</span>
          <span className="max-w-[min(60vw,28rem)] truncate rounded-md px-1.5 py-1 font-semibold text-[#D4D4D8]">
            {series.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleFavorite}
            aria-pressed={isFavorite}
            className={`flex min-h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors cursor-pointer ${
              isFavorite
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-[#141414] border-[#2F2F2F] text-neutral-400 hover:text-white hover:bg-[#2A2A2A]"
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                isFavorite ? "fill-amber-400 text-amber-400" : ""
              }`}
            />
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>

          <button
            type="button"
            onClick={onOpenEditModal}
            className="flex min-h-9 items-center gap-1.5 rounded-xl border border-[#2F2F2F] bg-[#141414] px-3 text-xs font-semibold text-neutral-300 transition-colors hover:bg-[#2A2A2A] hover:text-white cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Edit Info</span>
          </button>
        </div>
      </div>

      {/* Main Cover & Metadata Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-5 sm:p-6 lg:p-7 shadow-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          {/* Cover Poster */}
          <div className="relative aspect-[2/3] w-32 shrink-0 overflow-hidden rounded-md border border-white/10 bg-neutral-950 sm:w-40">
            {series.cover ? (
              <img
                src={series.cover}
                alt={series.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#101010]">
                <FolderOpen className="h-10 w-10 text-neutral-600" />
                <span className="text-[10px] font-semibold uppercase text-neutral-500">
                  No Cover
                </span>
              </div>
            )}
            <div className="absolute left-2 top-2 rounded bg-black/75 px-2 py-1 text-[9px] font-semibold uppercase text-white">
              SERIES COVER
            </div>
          </div>

          {/* Series Meta Info & Actions */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md border border-sky-300/20 bg-sky-300/10 px-2 py-1 text-xs font-medium text-sky-200">
                  {series.genre || "Fantasy Action"}
                </span>
                <span className="rounded-md border border-white/10 px-2 py-1 text-xs text-neutral-300">
                  By {series.author || "Unknown Author"}
                </span>
              </div>

              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl">
                {series.title}
              </h1>

              {series.synopsis && (
                <p className="max-w-3xl text-sm leading-relaxed text-neutral-300">
                  {series.synopsis}
                </p>
              )}
            </div>

            <p className="text-xs text-neutral-500">
              Updated{" "}
              {series.latestUpdatedAt
                ? new Date(series.latestUpdatedAt).toLocaleDateString()
                : "recently"}
            </p>

            <div className="grid grid-cols-1 gap-2 border-t border-[#2F2F2F] pt-4 sm:grid-cols-2 xl:flex xl:flex-wrap">
              <button
                onClick={onNewChapter}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400 px-4 text-sm font-bold text-black transition-colors hover:bg-emerald-300 xl:justify-start cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>New chapter</span>
              </button>

              <button
                onClick={onNavigateAudioStudio}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#2F2F2F] bg-[#141414] px-4 text-sm font-medium text-neutral-200 transition-colors hover:bg-[#2A2A2A] hover:text-white xl:justify-start cursor-pointer"
              >
                <Volume2 className="h-4 w-4 text-amber-400" />
                <span>Audio Studio</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
