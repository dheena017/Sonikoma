import React from "react";
import { EpisodeCard } from "@/features/workspace_scraper/episode-scraper/components/EpisodeCard";
import type { Episode } from "../types/EpisodeTypes";

interface EpisodeGridProps {
  episodes: Episode[];
  onEpisodeClick: (episode: Episode) => void;
  onPreviewClick?: (episode: Episode) => void;
  onBookmarkToggle?: (episodeUrl: string) => void;
  bookmarkedUrls?: string[];
  readUrls?: string[];
  isMultiSelectMode?: boolean;
  selectedUrls?: string[];
  onToggleSelect?: (episodeUrl: string) => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  episodes,
  onEpisodeClick,
  onPreviewClick,
  onBookmarkToggle,
  bookmarkedUrls = [],
  readUrls = [],
  isMultiSelectMode = false,
  selectedUrls = [],
  onToggleSelect,
}) => {
  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 w-full sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
      {episodes.map((episode) => (
        <EpisodeCard
          key={episode.index || episode.url}
          episode={episode}
          onClick={onEpisodeClick}
          onPreviewClick={onPreviewClick}
          onBookmark={onBookmarkToggle}
          isBookmarked={bookmarkedUrls.includes(episode.url)}
          isRead={readUrls.includes(episode.url)}
          isMultiSelectMode={isMultiSelectMode}
          isSelected={selectedUrls.includes(episode.url)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
};
