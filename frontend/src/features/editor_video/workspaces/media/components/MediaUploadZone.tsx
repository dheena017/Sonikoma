import React from "react";
import { UploadCloud } from "lucide-react";

interface MediaUploadZoneProps {
  onOpenBrowser: () => void;
}

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({ onOpenBrowser }) => {
  return (
    <div
      onClick={onOpenBrowser}
      className="rounded-[1.75rem] border border-purple-500/20 bg-[#0d0b18]/80 p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-purple-400/50 hover:bg-purple-950/30 space-y-3"
    >
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/12 border border-purple-500/15 shadow-[0_0_30px_rgba(168,85,247,0.12)]">
        <UploadCloud className="h-6 w-6 text-purple-300" />
      </div>
      <div>
        <p className="text-xs font-bold text-white">Upload MP4 · PNG · MP3</p>
        <span className="text-[9px] text-neutral-400 font-mono">Drag &amp; drop or click to browse</span>
      </div>
    </div>
  );
};
