// ─── MediaPickerModal ────────────────────────────────────────────────────────
// Canonical location: timeline/components/MediaPickerModal.tsx

import React from "react";
import { Image, Video, Music, Square, Sparkles, Upload, X } from "lucide-react";
import { MediaItem } from "../types";

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: MediaItem) => void;
}

const PRESET_ASSETS: MediaItem[] = [
  {
    id: "preset-1",
    type: "image",
    name: "Webtoon Panel 01",
    url: "https://placehold.co/120x160/1a1a24/a855f7?text=Panel+1",
    thumbnail: "https://placehold.co/120x160/1a1a24/a855f7?text=P1",
  },
  {
    id: "preset-2",
    type: "image",
    name: "Action FX Splash",
    url: "https://placehold.co/120x160/2a1a34/ec4899?text=Splash",
    thumbnail: "https://placehold.co/120x160/2a1a34/ec4899?text=FX",
  },
  {
    id: "preset-3",
    type: "video",
    name: "Camera Zoom Cut",
    url: "",
    thumbnail: "https://placehold.co/120x160/0f172a/38bdf8?text=Cut",
  },
  { id: "preset-4", type: "audio", name: "Impact Sound", duration: 1.5 },
  { id: "preset-5", type: "blank", name: "Blank Color Card", duration: 2.0 },
];

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[12000] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#14141c] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-white font-sans">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <h3 className="text-sm font-bold flex items-center gap-2 text-[#60A5FA]">
            <Sparkles className="h-4 w-4" />
            Add Media asset / blank clip
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="border-2 border-dashed border-white/15 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/5 transition-all cursor-pointer">
          <Upload className="h-6 w-6 text-[#3B82F6]" />
          <span className="text-xs text-neutral-300 font-medium">
            Drag and drop files here, or click to upload
          </span>
          <span className="text-[10px] text-neutral-500">
            Supports PNG, JPG, MP4, WAV, MP3
          </span>
        </div>

        {/* Presets Grid */}
        <div className="space-y-2">
          <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider">
            Quick Presets
          </span>
          <div className="grid grid-cols-3 gap-2">
            {PRESET_ASSETS.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectMedia(item);
                  onClose();
                }}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-[#3B82F6]/20 hover:border-[#60A5FA] transition-all cursor-pointer flex flex-col items-center gap-1.5 text-center group"
              >
                {item.type === "image" && (
                  <Image className="h-5 w-5 text-[#3B82F6] group-hover:scale-110 transition-transform" />
                )}
                {item.type === "video" && (
                  <Video className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
                )}
                {item.type === "audio" && (
                  <Music className="h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                )}
                {item.type === "blank" && (
                  <Square className="h-5 w-5 text-neutral-400 group-hover:scale-110 transition-transform" />
                )}
                <span className="text-[10px] font-medium truncate w-full">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(MediaPickerModal);
