import React from "react";
import { EpisodeCard } from "./EpisodeCard";
import { CheckSquare, Square } from "lucide-react";

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
  selectedIndices: number[];
  onSelectEpisode: (index: number) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
}

export const EpisodeGrid: React.FC<EpisodeGridProps> = ({
  episodes,
  selectedIndices,
  onSelectEpisode,
  onSelectAll,
  onClearSelection,
}) => {
  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 rounded-lg">
        <button
          onClick={
            selectedIndices.length === episodes.length
              ? onClearSelection
              : onSelectAll
          }
          className="flex items-center gap-2 px-3 py-1 text-sm text-gray-100 hover:bg-gray-700 rounded transition-colors"
          title={
            selectedIndices.length === episodes.length
              ? "Clear selection"
              : "Select all"
          }
        >
          {selectedIndices.length === episodes.length ? (
            <CheckSquare className="w-4 h-4 text-blue-500" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          <span>
            {selectedIndices.length > 0
              ? `${selectedIndices.length}/${episodes.length} selected`
              : "Select all"}
          </span>
        </button>

        {selectedIndices.length > 0 && (
          <>
            <div className="flex-1" />
            <button
              onClick={onClearSelection}
              className="px-3 py-1 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Episodes Grid */}
      {episodes.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {episodes.map((episode) => (
            <EpisodeCard
              key={episode.index}
              episode={episode}
              isSelected={selectedIndices.includes(episode.index)}
              onSelect={onSelectEpisode}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-400">No episodes found</p>
        </div>
      )}
    </div>
  );
};
