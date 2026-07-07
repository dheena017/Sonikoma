import React, { useState, useRef, useEffect } from "react";
import { 
  Calendar, 
  Image as ImageIcon, 
  Star, 
  ThumbsUp, 
  Clock, 
  Bookmark, 
  BookmarkCheck,
  MoreVertical,
  Download,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Eye
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
  onPreviewClick?: (episode: Episode) => void;
  onBookmark?: (episodeUrl: string) => void;
  onMarkReadToggle?: (episodeUrl: string) => void;
  isBookmarked?: boolean;
  isRead?: boolean;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (episodeUrl: string) => void;
}
import { getProxiedImageUrl } from "@/utils/url";

export const EpisodeCard: React.FC<EpisodeCardProps> = ({
  episode,
  onClick,
  onPreviewClick,
  onBookmark,
  onMarkReadToggle,
  isBookmarked = false,
  isRead = false,
  isMultiSelectMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (onBookmark) onBookmark(episode.url);
  };

  const handleCardClick = () => {
    if (isMultiSelectMode && onToggleSelect) {
      onToggleSelect(episode.url);
    } else {
      onClick(episode);
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(episode.url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsMenuOpen(false);
    }, 1500);
  };

  const handleExportSingleJSON = (e: React.MouseEvent) => {
    e.stopPropagation();
    const jsonContent = JSON.stringify(episode, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `episode_${episode.number.replace(/\s+/g, '_')}_metadata.json`;
    link.click();
    URL.revokeObjectURL(url);
    setIsMenuOpen(false);
  };

  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array(5).fill(0).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-655"}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-[280px] flex-shrink-0 snap-start group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-350 transform hover:-translate-y-1 bg-gray-800 border ${
        isSelected 
          ? "border-purple-500 ring-2 ring-purple-500/40 shadow-xl shadow-purple-950/20 bg-gray-750" 
          : "border-gray-700 hover:border-gray-500 shadow-md hover:shadow-2xl"
      }`}
    >
      <div className="relative w-full bg-gray-900 aspect-video overflow-hidden">
        {isMultiSelectMode && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect?.(episode.url)}
              className="w-5 h-5 rounded border-gray-600 text-purple-650 focus:ring-purple-500 bg-gray-900 cursor-pointer accent-purple-600 transition-transform duration-200 hover:scale-105"
            />
          </div>
        )}

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

        {/* Hover Actions Panel */}
        {!isMultiSelectMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/60 transition-all duration-300">
            <div className={`transform transition-all duration-300 ${isHovered ? 'scale-100 opacity-100' : 'scale-75 opacity-0'} flex flex-col gap-2 items-center`}>
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onClick(episode); 
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 px-4 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.5)] transition-colors text-xs"
              >
                <Download size={14} />
                Import Images
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onPreviewClick?.(episode); 
                }}
                className="bg-purple-650 hover:bg-purple-500 text-white font-semibold py-1.5 px-4 rounded-full flex items-center gap-1.5 shadow-[0_0_15px_rgba(124,58,237,0.5)] transition-colors text-xs"
              >
                <Eye size={14} />
                Quick Preview
              </button>
            </div>
          </div>
        )}

        <div className={`absolute top-2 ${isMultiSelectMode ? 'left-9' : 'left-2'} flex flex-col gap-1.5 transition-all duration-200 z-10`}>
          {episode.isNew && (
            <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm w-fit">
              New
            </span>
          )}
          {isRead && (
            <span className="bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shadow-sm flex items-center gap-0.5 w-fit">
              <CheckCircle2 size={10} className="fill-current" /> Read
            </span>
          )}
          {episode.rating && (
            <div className="bg-black/75 backdrop-blur-sm px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm border border-white/10">
              {renderRating(episode.rating)}
              <span className="text-[11px] font-semibold text-white">{episode.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button 
            onClick={handleBookmarkClick}
            className={`p-1.5 rounded-full backdrop-blur-sm transition-all duration-250 ${
              isBookmarked 
                ? 'bg-yellow-500 text-white opacity-100 shadow-md shadow-yellow-500/40 scale-105' 
                : 'bg-black/55 text-gray-300 hover:bg-white hover:text-black opacity-0 group-hover:opacity-100'
            }`}
          >
            {isBookmarked ? <BookmarkCheck size={14} className="fill-current" /> : <Bookmark size={14} />}
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
              className="h-full bg-red-650" 
              style={{ width: `${Math.min(100, Math.max(0, episode.progress))}%` }} 
            />
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 relative">
        <div className="flex justify-between items-start gap-2">
          <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight flex-1">
            <span className="text-blue-400 mr-2">{episode.number}</span>
            {episode.title}
          </h3>
          <button 
            className="text-gray-400 hover:text-white transition-colors mt-0.5 p-1 rounded hover:bg-gray-700" 
            onClick={handleMenuToggle}
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {isMenuOpen && (
          <div 
            ref={menuRef}
            onClick={(e) => e.stopPropagation()} 
            className="absolute right-4 bottom-12 w-48 bg-gray-900 border border-gray-750 rounded-lg shadow-2xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="py-1">
              <button
                onClick={(e) => {
                  handleBookmarkClick(e);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck size={14} className="text-yellow-500 fill-current" />
                    Remove Bookmark
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    Bookmark Episode
                  </>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onMarkReadToggle) onMarkReadToggle(episode.url);
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-xs text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                {isRead ? (
                  <>
                    <XCircle size={14} className="text-gray-400" />
                    Mark as Unread
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-green-500" />
                    Mark as Read
                  </>
                )}
              </button>

              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2 text-left text-xs text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition-colors font-medium"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-green-500" />
                    Copied Link!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Episode Link
                  </>
                )}
              </button>

              <button
                onClick={handleExportSingleJSON}
                className="w-full px-4 py-2 text-left text-xs text-gray-200 hover:bg-gray-800 flex items-center gap-2 transition-colors"
              >
                <Download size={14} />
                Export Metadata (JSON)
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 pt-1">
          {episode.date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{episode.date}</span>
            </div>
          )}

          {episode.date && episode.likes && <div className="w-1 h-1 bg-gray-650 rounded-full" />}

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
