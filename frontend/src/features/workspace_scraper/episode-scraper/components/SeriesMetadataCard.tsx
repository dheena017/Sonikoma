import React from "react";
import { Heart, ExternalLink, FileText } from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/url";
import type { Episode } from "../types/EpisodeTypes";

interface SeriesMetadata {
  seriesSlug?: string;
  title: string;
  author: string;
  genre: string;
  cover_image: string;
  description: string;
  url?: string;
}

interface SeriesMetadataCardProps {
  seriesMetadata: SeriesMetadata | null;
  urlInput: string;
  isFavorite: boolean;
  onAddToFavorites: () => void;
  onCopyAiPrompt: () => void;
}

const SeriesMetadataCard: React.FC<SeriesMetadataCardProps> = ({
  seriesMetadata,
  urlInput,
  isFavorite,
  onAddToFavorites,
  onCopyAiPrompt,
}) => {
  if (!seriesMetadata) return null;

  return (
    <div className="bg-neutral-900/30 border border-neutral-800/80 p-6 rounded-3xl flex flex-col md:flex-row gap-6 relative overflow-hidden backdrop-blur-sm">
      {seriesMetadata.cover_image && (
        <img
          src={getProxiedImageUrl(seriesMetadata.cover_image, seriesMetadata.url || urlInput)}
          alt={seriesMetadata.title}
          className="w-full md:w-36 h-48 md:h-auto object-cover rounded-2xl border border-neutral-800/60 flex-shrink-0 shadow-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23374151' width='100' height='100'/%3E%3C/svg%3E";
          }}
        />
      )}
      <div className="flex-grow min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold text-white truncate">{seriesMetadata.title}</h1>
            <button
              onClick={onAddToFavorites}
              className={`p-2 rounded-xl border transition-all ${
                isFavorite
                  ? "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30"
                  : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
              }`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <Heart size={16} className={isFavorite ? "fill-current" : ""} />
            </button>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Author: <span className="text-neutral-300 mr-4">{seriesMetadata.author || "Unknown"}</span>
            Genre: <span className="text-neutral-300">{seriesMetadata.genre || "N/A"}</span>
          </p>
          <p className="text-xs text-neutral-400 mt-4 leading-relaxed line-clamp-3">
            {seriesMetadata.description}
          </p>
        </div>
        {seriesMetadata.url && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <a
              href={seriesMetadata.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition-colors"
            >
              Original Webtoon URL <ExternalLink size={12} />
            </a>

            <button
              onClick={onCopyAiPrompt}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-purple-500/40 rounded-xl text-xs font-mono font-bold text-purple-300 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Copy AI Script Prompt for video creation"
            >
              <FileText size={13} className="text-purple-400" />
              Copy AI Script Prompt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeriesMetadataCard;
