import React from "react";
import { Heart, Sparkles } from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/url";
import { EpisodeRatingDisplay } from "./EpisodeRatingDisplay";

export interface SeriesMetadata {
  title: string;
  author?: string;
  genre?: string;
  description?: string;
  cover_image?: string;
  url?: string;
  rating?: number;
  likes?: string;
  views?: number;
  total_episodes?: number;
}

export interface EpisodeScraperHeaderProps {
  seriesMetadata: SeriesMetadata;
  urlInput: string;
  isFavorite: boolean;
  handleAddToFavorites: () => void;
  handleCopyAiPrompt: () => void;
}

export const EpisodeScraperHeader: React.FC<EpisodeScraperHeaderProps> = ({
  seriesMetadata,
  urlInput,
  isFavorite,
  handleAddToFavorites,
  handleCopyAiPrompt,
}) => {
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAiPrompt}
                className="px-3 py-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                title="Copy AI Script & Recap Prompt"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>AI Prompt</span>
              </button>
              <button
                type="button"
                onClick={handleAddToFavorites}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isFavorite
                    ? "bg-red-500/20 border-red-500/30 text-red-500 hover:bg-red-500/30"
                    : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                <Heart size={16} className={isFavorite ? "fill-current" : ""} />
              </button>
            </div>
          </div>
          <p className="text-xs text-neutral-500 mt-1 font-mono">
            Author: <span className="text-neutral-300 mr-4">{seriesMetadata.author || "Unknown"}</span>
            Genre: <span className="text-neutral-300">{seriesMetadata.genre || "General"}</span>
          </p>
          {seriesMetadata.description && (
            <p className="text-xs text-neutral-400 mt-3 line-clamp-2 leading-relaxed">
              {seriesMetadata.description}
            </p>
          )}
        </div>
        {(seriesMetadata.rating !== undefined || seriesMetadata.likes || seriesMetadata.views) && (
          <div className="mt-4 pt-4 border-t border-neutral-800/60">
            <EpisodeRatingDisplay
              rating={seriesMetadata.rating}
              likes={seriesMetadata.likes}
              views={seriesMetadata.views}
            />
          </div>
        )}
      </div>
    </div>
  );
};
