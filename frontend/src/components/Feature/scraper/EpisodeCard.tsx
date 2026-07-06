import React from "react";
import { Play, Calendar, Image as ImageIcon, Star, ThumbsUp } from "lucide-react";

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

interface EpisodeCardProps {
  episode: Episode;
  isSelected: boolean;
  onSelect: (episodeIndex: number) => void;
}

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  isSelected,
  onSelect,
}) => {
  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Star
              key={i}
              size={12}
              className={i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-600"}
            />
          ))}
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelect(episode.index)}
      className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 transform hover:scale-105 ${
        isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-full bg-gray-900 aspect-video overflow-hidden">
        {episode.thumbnail ? (
          <img
            src={episode.thumbnail}
            alt={episode.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
          <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}

        {/* Rating badge */}
        {episode.rating && (
          <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded flex items-center gap-1">
            {renderRating(episode.rating)}
            <span className="text-xs font-medium text-white">{episode.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Episode Info */}
      <div className="p-3 bg-gray-800 space-y-2">
        <h3 className="text-sm font-semibold text-white truncate">
          {episode.number}
        </h3>
        <p className="text-xs text-gray-300 truncate">{episode.title}</p>

        {episode.date && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{episode.date}</span>
          </div>
        )}

        {episode.likes && (
          <div className="flex items-center gap-1 text-xs text-blue-400">
            <ThumbsUp size={12} />
            <span>{episode.likes}</span>
          </div>
        )}
      </div>
    </div>
  );
};
