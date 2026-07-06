import React from "react";
import { EpisodeCard } from "./EpisodeCard";

interface Episode {
  number: string;
  title: string;
  date: string;
  thumbnail: string;
  url: string;
  index: number;
  rating?: number;
  likes?: string;
}

interface EpisodeGridProps {
  episodes: Episode[];
  onEpisodeClick: (episode: Episode) => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  episodes,
  onEpisodeClick,
}) => {
  if (!episodes || episodes.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 p-4">
      {episodes.map((episode) => (
        <EpisodeCard
          key={episode.index}
          episode={episode}
          onClick={onEpisodeClick}
        />
      ))}
    </div>
  );
};
