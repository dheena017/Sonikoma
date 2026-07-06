import React, { useState } from "react";
import { 
  Calendar, 
  Image as ImageIcon, 
  Star, 
  ThumbsUp, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  MoreVertical,
  Download // <-- Added Download icon for the Import button
} from "lucide-react";

interface Episode {
  number: string;
  title: string;
  date: string;
  thumbnail: string;
  url: string;
  index: number;
  rating?: number;
  likes?: string;
  duration?: string;
  progress?: number;
  isNew?: boolean;
}

interface EpisodeCardProps {
  episode: Episode;
  onClick: (episode: Episode) => void; 
  onBookmark?: (episodeIndex: number) => void;
}

const getProxiedImageUrl = (url: string) => {
  if (!url) return "";
  return `/api/proxy/image?url=${encodeURIComponent(url)}`;
};

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onClick,
  onBookmark,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    setIsBookmarked(!isBookmarked);
    if (onBookmark) onBookmark(episode.index);
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array(5).fill(0).map((_, i) => (
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
      onClick={() => onClick(episode)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="w-[280px] flex-shrink-0 snap-start group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl bg-gray-800 border border-gray-700 hover:border-gray-500"
    >
      <div className="relative w-full bg-gray-900 aspect-video overflow-hidden">
        {episode.thumbnail ? (
          <img
            src={getProxiedImageUrl(episode.thumbnail)}
            alt={episode.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isHovered ? "scale-110" : "scale-100"
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <ImageIcon className="w-10 h-10 text-gray-600" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

        {/* --- NEW: EXPLICIT IMPORT IMAGES BUTTON OVERLAY --- */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-all duration-300">
          <div className={`transform transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'}`}>
            <button 
              onClick={(e) => {
                e.stopPropagation(); // Prevents clicking the card twice
                onClick(episode);    // Routes to the editor just like clicking the card does
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-colors"
            >
              <Download size={18} />
              Import Images
            </button>
          </div>
        </div>
        {/* ------------------------------------------------ */}

        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {episode.isNew && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm">
              New
            </span>
          )}
          {episode.rating && (
            <div className="bg-black/70 backdrop-blur-sm px-2 py-1 rounded flex items-center gap-1 shadow-sm border border-white/10">
              {renderRating(episode.rating)}
              <span className="text-xs font-medium text-white">{episode.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-2">
          <button 
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 ${
              isBookmarked ? 'bg-blue-500 text-white' : 'bg-black/50 text-gray-300 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100'
            }`}
          >
            {isBookmarked ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
          </button>
        </div>

        {episode.duration && (
          <div className="absolute bottom-3 right-2 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded border border-white/10 flex items-center gap-1">
            <Clock size={10} />
            {episode.duration}
          </div>
        )}

        {episode.progress !== undefined && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
            <div 
              className="h-full bg-red-600" 
              style={{ width: `${Math.min(100, Math.max(0, episode.progress))}%` }} 
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight flex-1">
            <span className="text-blue-400 mr-2">{episode.number}</span>
            {episode.title}
          </h3>
          <button className="text-gray-400 hover:text-white transition-colors mt-0.5" onClick={(e) => e.stopPropagation()}>
            <MoreVertical size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
          {episode.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{episode.date}</span>
            </div>
          )}

          {episode.date && episode.likes && <div className="w-1 h-1 bg-gray-600 rounded-full" />}

          {episode.likes && (
            <div className="flex items-center gap-1.5 text-gray-300">
              <ThumbsUp size={12} className="text-blue-400" />
              <span>{episode.likes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
