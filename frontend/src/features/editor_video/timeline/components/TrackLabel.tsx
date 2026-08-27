// ─── TrackLabel ───────────────────────────────────────────────────────────────
// Canonical location: timeline/components/TrackLabel.tsx
// High-visibility left track header with distinct track badge, clear label text,
// and clean non-overlapping action controls.

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
  <div className="w-44 shrink-0 h-full sticky left-0 z-20 flex items-center justify-between px-3 border-r border-white/10 group bg-[#0d0d16] shadow-[3px_0_12px_rgba(0,0,0,0.6)] select-none">
    {/* Track ID & Name (Always prominent & readable) */}
    <div className="flex items-center gap-1.5 min-w-0 pr-1 overflow-hidden">
      <span
        className={`text-[9px] font-mono font-black ${color} shrink-0 px-1 py-0.5 rounded bg-white/[0.05] border border-white/10`}
      >
        {id}
      </span>
      <span className="text-neutral-200 text-[10px] font-mono font-bold truncate group-hover:text-white transition-colors">
        {label}
      </span>
    </div>

    {/* Compact Action Icons Toolbar */}
    <div className="flex items-center gap-0.5 shrink-0 bg-black/50 px-1 py-0.5 rounded border border-white/10 opacity-70 group-hover:opacity-100 transition-opacity">
      {onAdd && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          title={`Add item to ${label}`}
          className="p-0.5 rounded hover:bg-purple-600/50 text-purple-400 hover:text-white transition-colors cursor-pointer"
        >
          <Plus className="h-2.5 w-2.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onToggleLock}
        title={locked ? "Unlock track" : "Lock track"}
        className={`p-0.5 rounded transition-colors cursor-pointer ${
          locked
            ? "text-amber-400 bg-amber-950/60"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        <Lock className="h-2.5 w-2.5" />
      </button>

      <button
        type="button"
        onClick={onToggleHide}
        title={hidden ? "Show track" : "Hide track"}
        className={`p-0.5 rounded transition-colors cursor-pointer ${
          hidden
            ? "text-red-400 bg-red-950/60"
            : "text-neutral-400 hover:text-white"
        }`}
      >
        {hidden ? (
          <EyeOff className="h-2.5 w-2.5 text-red-400" />
        ) : (
          <Eye className="h-2.5 w-2.5" />
        )}
      </button>

      {type === "audio" && (
        <button
          type="button"
          onClick={onToggleMute}
          title={muted ? "Unmute" : "Mute"}
          className={`p-0.5 rounded transition-colors cursor-pointer ${
            muted
              ? "text-rose-400 bg-rose-950/60"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {muted ? (
            <VolumeX className="h-2.5 w-2.5 text-rose-400" />
          ) : (
            <Volume2 className="h-2.5 w-2.5" />
          )}
        </button>
      )}
    </div>
  </div>
);

export default React.memo(TrackLabel);
