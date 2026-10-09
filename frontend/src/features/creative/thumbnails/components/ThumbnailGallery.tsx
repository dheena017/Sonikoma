import React from "react";
import {
  Download,
  Maximize2,
  Sparkles,
  Youtube,
  Layers,
  Check,
} from "lucide-react";
import { GeneratedThumbnailItem } from "../types";

interface ThumbnailGalleryProps {
  thumbnails: GeneratedThumbnailItem[];
  onPreview: (item: GeneratedThumbnailItem) => void;
  onDownload: (item: GeneratedThumbnailItem) => void;
  onSelectForYouTube?: (item: GeneratedThumbnailItem) => void;
}

export const ThumbnailGallery: React.FC<ThumbnailGalleryProps> = ({
  thumbnails,
  onPreview,
  onDownload,
  onSelectForYouTube,
}) => {
  if (!thumbnails || thumbnails.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F]">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#E5E5E5] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
            {thumbnails.length === 1
              ? "Generated YouTube Thumbnail (16:9 HD)"
              : `Generated Thumbnail Package (${thumbnails.length} Variants)`}
          </h2>
          <p className="text-xs text-[#9CA3AF] mt-0.5">
            Click thumbnail for full-resolution preview, instant HD download, or direct YouTube export
          </p>
        </div>
        <div className="px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] text-xs font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
          <span>1280x720 &bull; 16:9 HD</span>
        </div>
      </div>

      <div
        className={
          thumbnails.length === 1
            ? "max-w-2xl mx-auto w-full"
            : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        }
      >
        {thumbnails.map((item, index) => (
          <div
            key={item.id}
            className="group rounded-2xl overflow-hidden border border-[#2F2F2F] bg-[#1E1E1E] hover:border-[#3B82F6]/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col"
          >
            {/* Thumbnail Image Container */}
            <div
              className="relative bg-[#121212] overflow-hidden cursor-pointer w-full"
              style={{
                aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : "16 / 9",
                maxHeight: "680px",
              }}
              onClick={() => onPreview(item)}
            >
              <img
                src={item.image_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />

              {/* Overlay Badges */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#121212]/90 backdrop-blur-md text-[10px] font-mono font-bold text-[#E5E5E5] uppercase border border-[#2F2F2F]">
                {thumbnails.length === 1 ? `${item.aspect_ratio || "16:9"} Master` : `Option #${index + 1}`}
              </div>

              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-[#3B82F6] text-white backdrop-blur-md text-[10px] font-mono font-bold uppercase shadow-md">
                {item.archetype_label}
              </div>

              {/* Hover Quick Actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(item);
                  }}
                  className="p-3 rounded-xl bg-[#1E1E1E]/90 text-white hover:bg-[#252525] border border-[#2F2F2F] transition-all shadow-lg hover:scale-110 cursor-pointer"
                  title="Full resolution preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownload(item);
                  }}
                  className="p-3 rounded-xl bg-[#3B82F6] text-white hover:bg-[#2563EB] transition-all shadow-lg hover:scale-110 cursor-pointer"
                  title="Download thumbnail"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Thumbnail Details & Actions */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#9CA3AF]">
                    Hook Text
                  </span>
                  {/* Palette Preview */}
                  <div className="flex items-center gap-1">
                    {item.palette.map((color, cIdx) => (
                      <span
                        key={cIdx}
                        className="w-2.5 h-2.5 rounded-full border border-black/40"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-[#E5E5E5] tracking-wide truncate">
                  "{item.hook_text}"
                </h3>
                <p className="text-[11px] text-[#9CA3AF] mt-0.5 line-clamp-1 font-mono">
                  Archetype: {item.archetype_label}
                </p>

                {/* AI Smart Routing Tier & Telemetry Badges */}
                <div className="mt-2.5 pt-2 border-t border-[#2F2F2F]/60 flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#3B82F6]/15 border border-[#3B82F6]/30 text-[#93c5fd] text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                    {item.tier_used || "Tier 1: Primary"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#6ee7b7] text-[10px] font-mono font-semibold">
                    {item.model_used || "flux-anime"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#F59E0B]/15 border border-[#F59E0B]/30 text-[#fcd34d] text-[10px] font-mono font-semibold">
                    {item.aspect_ratio || "16:9"} ({item.width}×{item.height})
                  </span>
                  {item.provider_used && (
                    <span className="px-2 py-0.5 rounded-md bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#c4b5fd] text-[10px] font-mono">
                      {item.provider_used}
                    </span>
                  )}
                </div>

                {item.cascade_path && item.cascade_path.includes("->") && (
                  <p className="text-[10px] text-[#9CA3AF] font-mono truncate mt-1" title={item.cascade_path}>
                    <span className="text-amber-400 font-bold">Route:</span> {item.cascade_path}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[#2F2F2F] flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onDownload(item)}
                  className="flex-1 py-2 px-3 rounded-xl bg-[#121212] hover:bg-[#252525] border border-[#2F2F2F] hover:border-neutral-700 text-[#E5E5E5] text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>

                {onSelectForYouTube && (
                  <button
                    type="button"
                    onClick={() => onSelectForYouTube(item)}
                    className="py-2 px-3 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    title="Set as active thumbnail for YouTube export"
                  >
                    <Youtube className="w-3.5 h-3.5" />
                    <span>Use for YouTube</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThumbnailGallery;
