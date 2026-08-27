// ─── TrackLabel ───────────────────────────────────────────────────────────────
// Canonical location: timeline/components/TrackLabel.tsx

import React from "react";
import { Lock, Eye, EyeOff, Volume2, VolumeX, Plus } from "lucide-react";

interface TrackLabelProps {
  id: string;
  label: string;
  color: string;
  type: "video" | "audio";
  locked: boolean;
  hidden: boolean;
  muted: boolean;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onToggleMute: () => void;
  onAdd?: () => void;
}

const TrackLabel: React.FC<TrackLabelProps> = ({
  id,
  label,
  color,
  type,
  locked,
  hidden,
  muted,
  onToggleLock,
  onToggleHide,
  onToggleMute,
  onAdd,
}) => (
  <div className="w-28 shrink-0 h-full flex items-center gap-1.5 px-3 border-r border-white/5 group relative bg-[#09090f]">
    <span className={`text-[10px] font-bold ${color} shrink-0`}>{id}</span>
    <span className="text-neutral-400 text-[10px] font-mono font-medium truncate">
      {label}
    </span>

    <div className="absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-[#09090f]/90 px-0.5 rounded">
      {onAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          title={`Add item to ${label}`}
          className="p-0.5 rounded cursor-pointer text-purple-400 hover:text-white hover:bg-purple-600/40 transition-colors"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onToggleLock}
        title={locked ? "Unlock track" : "Lock track"}
        className={`p-0.5 rounded cursor-pointer ${
          locked ? "text-amber-400" : "text-neutral-500 hover:text-white"
        }`}
      >
        <Lock className="h-2.5 w-2.5" />
      </button>

      <button
        type="button"
        onClick={onToggleHide}
        title={hidden ? "Show track" : "Hide track"}
        className="p-0.5 rounded cursor-pointer text-neutral-500 hover:text-white"
      >
        {hidden ? (
          <EyeOff className="h-2.5 w-2.5" />
        ) : (
          <Eye className="h-2.5 w-2.5" />
        )}
      </button>

      {type === "audio" && (
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? "Unmute" : "Mute"}
          className={`p-0.5 rounded cursor-pointer ${
            muted ? "text-red-400" : "text-neutral-500 hover:text-white"
          }`}
        >
          {muted ? (
            <VolumeX className="h-2.5 w-2.5" />
          ) : (
            <Volume2 className="h-2.5 w-2.5" />
          )}
        </button>
      )}
    </div>
  </div>
);

export default React.memo(TrackLabel);
