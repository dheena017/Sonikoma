import React from "react";
import { EpisodeCard } from "./EpisodeCard";

interface Episode {
  number: string;
  title: string;
  date: string;
  thumbnail: string;
  url: string;
  index: number;
}

interface EpisodeGridProps {
  episodes: Episode[];
  onEpisodeClick: (episode: Episode) => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  episodes,
  onEpisodeClick,
}) => {
  return (
    <div>
      <div className="flex overflow-x-auto gap-4 pb-6 pt-1.5 px-2 snap-x snap-mandatory scroll-smooth hide-scrollbar">
        {episodes.map((episode) => (
          <div key={episode.index} className="snap-start">
            <EpisodeCard
              episode={episode}
              onClick={onEpisodeClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

