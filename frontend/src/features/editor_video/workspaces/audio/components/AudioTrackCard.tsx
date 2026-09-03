import React from "react";
import { Play, Pause } from "lucide-react";
import { AudioTrack } from "../../../types/workspace.types";

interface AudioTrackCardProps {
  track: AudioTrack;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onAddTrack: () => void;
}

export const AudioTrackCard: React.FC<AudioTrackCardProps> = ({
  track,
  isPlaying,
  onTogglePlay,
  onAddTrack,
}) => {
  return (
    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-[#3B82F6]/60 flex items-center gap-2.5 group cursor-pointer shadow-sm">
      <button
        onClick={onTogglePlay}
        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all border cursor-pointer ${
          isPlaying
            ? "bg-purple-600 border-[#60A5FA] text-white"
            : "bg-neutral-800 border-neutral-700 text-neutral-400 group-hover:text-white"
        }`}
      >
        {isPlaying ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{track.title}</p>
        <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-400">
          <span>{track.duration}</span>
          {track.mood && (
            <span className="text-[#3B82F6]">• {track.mood}</span>
          )}
          {track.badge && (
            <span className="text-amber-400">• {track.badge}</span>
          )}
        </div>
      </div>
      <button
        onClick={onAddTrack}
        className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-[#3B82F6] text-white text-[9px] font-mono font-bold transition-colors cursor-pointer"
      >
        + Add
      </button>
    </div>
  );
};
