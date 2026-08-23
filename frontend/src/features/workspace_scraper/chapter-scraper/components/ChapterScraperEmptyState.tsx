import React from "react";
import { BookOpen } from "lucide-react";

export interface ChapterScraperEmptyStateProps {
  urlInput: string;
  isLoading?: boolean;
  error?: string | null;
}

export const ChapterScraperEmptyState: React.FC<
  ChapterScraperEmptyStateProps
> = ({ urlInput, isLoading = false, error = null }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-neutral-400 animate-pulse">
          Fetching chapter list...
        </p>
        <p className="text-xs text-neutral-600 font-mono max-w-xs text-center truncate">
          {urlInput}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-950/40 border border-red-900/40 flex items-center justify-center">
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-bold text-red-400">
            Failed to fetch chapters
          </p>
          <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-16 text-center space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-purple-950/30 border border-purple-900/30 flex items-center justify-center">
        <BookOpen className="w-7 h-7 text-purple-400 opacity-60" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-bold text-neutral-400">No Chapters Found</p>
        <p className="text-xs text-neutral-600 max-w-sm leading-relaxed">
          Paste a valid comic or manga series URL above and press Enter to load its
          chapter list.
        </p>
      </div>
    </div>
  );
};

export const EpisodeScraperEmptyState = ChapterScraperEmptyState;
