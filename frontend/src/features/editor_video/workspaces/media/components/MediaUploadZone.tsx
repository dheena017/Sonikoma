import React from "react";
import { UploadCloud } from "lucide-react";

interface MediaUploadZoneProps {
  onOpenBrowser: () => void;
}

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({ onOpenBrowser }) => {
  return (
    <div
      onClick={onOpenBrowser}
      className="rounded-2xl border-2 border-dashed border-neutral-700 hover:border-purple-500/70 bg-neutral-900/40 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all space-y-2"
    >
      <UploadCloud className="h-6 w-6 text-purple-400" />
      <p className="text-xs font-bold text-white">Upload MP4 · PNG · MP3</p>
      <span className="text-[9px] text-neutral-400 font-mono">Drag &amp; drop or click to browse</span>
    </div>
  );
};
