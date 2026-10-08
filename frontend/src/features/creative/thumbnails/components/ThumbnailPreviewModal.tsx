import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Download, Youtube, Image } from "lucide-react";
import { GeneratedThumbnailItem } from "../types";

interface ThumbnailPreviewModalProps {
  item: GeneratedThumbnailItem | null;
  onClose: () => void;
  onDownload: (item: GeneratedThumbnailItem) => void;
  onSelectForYouTube?: (item: GeneratedThumbnailItem) => void;
}

export const ThumbnailPreviewModal: React.FC<ThumbnailPreviewModalProps> = ({
  item,
  onClose,
  onDownload,
  onSelectForYouTube,
}) => {
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6"
      data-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Card */}
      <div
        className="relative w-full max-w-4xl bg-[#181818] border border-[#2F2F2F] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-150 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2F2F2F] bg-[#141414] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] text-[#3B82F6]">
              <Image className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#E5E5E5] line-clamp-1">{item.title}</h3>
              <p className="text-xs text-[#9CA3AF] font-mono">
                {item.archetype_label} &bull; 1280x720 (16:9)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525] border border-transparent hover:border-[#2F2F2F] transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Preview Image */}
        <div className="relative bg-black flex-1 min-h-0 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="max-h-[min(58vh,560px)] w-auto max-w-full object-contain rounded-xl shadow-2xl border border-[#2F2F2F]"
          />
        </div>

        {/* Footer info & actions */}
        <div className="p-4 sm:p-5 border-t border-[#2F2F2F] bg-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase text-[#9CA3AF] block">
              Hook Text Sticker:
            </span>
            <p className="text-sm font-bold text-[#E5E5E5] font-mono truncate">
              "{item.hook_text}"
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onDownload(item)}
              className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-[#3B82F6]/20 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download HD 1280x720</span>
            </button>

            {onSelectForYouTube && (
              <button
                type="button"
                onClick={() => {
                  onSelectForYouTube(item);
                  onClose();
                }}
                className="px-4 sm:px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-red-950/40 active:scale-95"
              >
                <Youtube className="w-4 h-4" />
                <span>Use for YouTube</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ThumbnailPreviewModal;
