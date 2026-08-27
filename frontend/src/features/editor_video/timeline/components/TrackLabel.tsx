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
}) => (
  <div className="w-48 shrink-0 h-full sticky left-0 z-30 flex items-center justify-between px-3 border-r border-white/10 group bg-[#0d0d16] shadow-[4px_0_16px_rgba(0,0,0,0.85)] select-none">
    {/* Track ID & Name (Always prominent & readable, never truncated) */}
    <div className="flex items-center gap-2 min-w-0 pr-1 overflow-hidden">
      <span
        className={`text-[9px] font-mono font-black ${color} shrink-0 px-1 py-0.5 rounded bg-white/[0.05] border border-white/10`}
      >
        {id}
      </span>
      <span className="text-neutral-200 text-[10.5px] font-mono font-bold whitespace-nowrap group-hover:text-white transition-colors">
        {label}
      </span>
    </div>

    {/* Compact Action Icons Toolbar */}
    <div className="flex items-center gap-1 shrink-0 bg-black/60 px-1.5 py-0.5 rounded border border-white/10 opacity-80 group-hover:opacity-100 transition-opacity">
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
