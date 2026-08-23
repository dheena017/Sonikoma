import React from "react";
import { ChapterCard } from "./ChapterCard";
import type { Chapter } from "../types/ChapterTypes";

interface ChapterGridProps {
  chapters: Chapter[];
  onChapterClick: (chapter: Chapter) => void;
  onPreviewClick?: (chapter: Chapter) => void;
  onBookmarkToggle?: (chapterUrl: string) => void;
  bookmarkedUrls?: string[];
  readUrls?: string[];
  isMultiSelectMode?: boolean;
  selectedUrls?: string[];
  onToggleSelect?: (chapterUrl: string) => void;
}

export const ChapterGrid: React.FC<ChapterGridProps> = ({
  chapters,
  onChapterClick,
  onPreviewClick,
  onBookmarkToggle,
  bookmarkedUrls = [],
  readUrls = [],
  isMultiSelectMode = false,
  selectedUrls = [],
  onToggleSelect,
}) => {
  if (!chapters || chapters.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 w-full sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
      {chapters.map((chapter) => (
        <ChapterCard
          key={chapter.index || chapter.url}
          chapter={chapter}
          onClick={onChapterClick}
          onPreviewClick={onPreviewClick}
          onBookmark={onBookmarkToggle}
          isBookmarked={bookmarkedUrls.includes(chapter.url)}
          isRead={readUrls.includes(chapter.url)}
          isMultiSelectMode={isMultiSelectMode}
          isSelected={selectedUrls.includes(chapter.url)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
};

export const EpisodeGrid = ChapterGrid;
