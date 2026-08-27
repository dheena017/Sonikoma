// ─── TimelineMusicTrack (A1 Music / BGM Track) ────────────────────────────────
// Canonical location: timeline/components/tracks/TimelineMusicTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Music, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";

export interface TimelineMusicTrackProps {
  musicTheme?: string;
  musicUrl?: string;
  duration?: number;
  totalDuration: number;
  selectedClip: string | null;
  muted: boolean;
  locked: boolean;
  hidden: boolean;
  onToggleMute: () => void;
  onToggleLock: () => void;
  onToggleHide: () => void;
  onClipClick: (key: string, idx: number) => void;
  onContextMenu: (e: React.MouseEvent, key: string, idx: number) => void;
  onDurationChange?: (key: string, duration: number) => void;
  onAddMusic?: () => void;
}

export const TimelineMusicTrack: React.FC<TimelineMusicTrackProps> = ({
  musicTheme,
  musicUrl,
  duration,
  totalDuration,
  selectedClip,
  muted,
  locked,
  hidden,
  onToggleMute,
  onToggleLock,
  onToggleHide,
  onClipClick,
  onContextMenu,
  onDurationChange,
  onAddMusic,
}) => {
  const [resizingSide, setResizingSide] = useState<"left" | "right" | null>(null);
  const [deltaSecs, setDeltaSecs] = useState<number>(0);
  // per-clip offsets to persist moved positions (only one clip currently)
  const [clipOffsets, setClipOffsets] = useState<Record<string, number>>({});
  const [movingInfo, setMovingInfo] = useState<{ key: string; deltaPx: number } | null>(null);
  const movingInfoRef = React.useRef(movingInfo);
  React.useEffect(() => {
    movingInfoRef.current = movingInfo;
  }, [movingInfo]);

  const clipDuration = (duration && duration > 0 ? duration : (totalDuration > 0 ? totalDuration : 0));

  const handleMoveStart = (
    e: React.MouseEvent,
    key: string,
    idx: number,
    baseLeftPx: number,
    widthPx: number
  ) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    const startX = e.clientX;
    let hasMoved = false;
    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
    setMovingInfo({ key, deltaPx: 0 });

    const onMouseMove = (mv: MouseEvent) => {
      const deltaPx = mv.clientX - startX;
      if (Math.abs(deltaPx) > 2) {
        hasMoved = true;
      }
      setMovingInfo({ key, deltaPx });
    };

    const onMouseUp = () => {
      if (!hasMoved) {
        onClipClick(key, idx);
      } else {
        const desiredLeft = baseLeftPx + (movingInfoRef.current?.deltaPx ?? 0);
        const clampedLeft = Math.max(0, desiredLeft);
        const finalOffset = clampedLeft - baseLeftPx;
        setClipOffsets((prev) => ({
          ...prev,
          [key]: (prev[key] ?? 0) + finalOffset,
        }));
      }
      setMovingInfo(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    side: "left" | "right",
    initialDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingSide(side);
    setDeltaSecs(0);

    const startX = e.clientX;
    let latestDuration = initialDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const delta = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(1, initialDuration + delta);
      const rounded = parseFloat(nextDuration.toFixed(1));
      latestDuration = rounded;
      setDeltaSecs(parseFloat((rounded - initialDuration).toFixed(1)));
      onDurationChange?.("a1-0", rounded);
    };

    const onMouseUp = () => {
      if (side === "left") {
        const durDiff = initialDuration - latestDuration;
        const shiftPx = durDiff * 30;
        setClipOffsets((prev) => ({
          ...prev,
          ["a1-0"]: (prev["a1-0"] ?? 0) + shiftPx,
        }));
      }
      setResizingSide(null);
      setDeltaSecs(0);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const hasMusic =
    duration !== 0 &&
    ((!!musicTheme && musicTheme !== "none" && musicTheme !== "No Music" && musicTheme.trim() !== "") ||
    !!musicUrl);

  const displayTheme =
    (musicTheme &&
    musicTheme !== "none" &&
    musicTheme !== "No Music" &&
    musicTheme.trim() !== "" &&
    !musicTheme.startsWith("http") &&
    !musicTheme.startsWith("blob:") &&
    !musicTheme.startsWith("/"))
      ? musicTheme
      : (musicUrl ? musicUrl.split("/").pop() || musicUrl : musicTheme || "");

  const displayWidthPx = Math.max(
    30,
    (clipDuration + (resizingSide === "right" ? deltaSecs : resizingSide === "left" ? -deltaSecs : 0)) * 30
  );

  return (
    <div
      className={`h-[46px] border-b border-white/[0.04] flex items-center ${
        muted ? "opacity-40" : ""
      }`}
    >
      <TrackLabel
        id="A1"
        label="Music (BGM)"
        color="text-emerald-400"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onAdd={onAddMusic}
      />
      <div className="flex-1 relative h-[38px] overflow-hidden" style={{ clipPath: "inset(0)" }}>
        {!hasMusic ? (
          <button
            type="button"
            onClick={onAddMusic}
            className="h-full flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 hover:text-emerald-300 italic px-2 hover:bg-emerald-950/20 rounded-md transition-colors cursor-pointer group"
          >
            <Plus className="h-2.5 w-2.5 text-emerald-400/70 group-hover:text-emerald-300 transition-colors" />
            <span>Add background music / soundtrack</span>
          </button>
        ) : (
          <div
            onMouseDown={(e) =>
              handleMoveStart(
                e,
                "a1-0",
                0,
                clipOffsets["a1-0"] ?? 0,
                displayWidthPx
              )
            }
            onContextMenu={(e) => onContextMenu(e, "a1-0", 0)}
            className={`group absolute inset-y-0 rounded-md overflow-hidden select-none border z-10 ${
              movingInfo?.key === "a1-0"
                ? "cursor-grabbing shadow-[0_4px_20px_rgba(52,211,153,0.4)] z-40 border-emerald-300"
                : resizingSide !== null
                ? "cursor-col-resize border-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.5)] z-30"
                : selectedClip === "a1-0"
                ? "cursor-grab border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.3)] z-20"
                : "cursor-grab border-emerald-500/40 hover:border-emerald-300/80 z-10"
            } bg-[#047857]`}
            style={{
              left: `${
                Math.max(
                  0,
                  (clipOffsets["a1-0"] ?? 0) -
                    (resizingSide === "left" ? deltaSecs * 30 : 0)
                ) + (movingInfo?.key === "a1-0" ? movingInfo.deltaPx : 0)
              }px`,
              width: `${displayWidthPx}px`,
              cursor:
                movingInfo?.key === "a1-0"
                  ? "grabbing"
                  : resizingSide !== null
                  ? "col-resize"
                  : "grab",
            }}
          >
            {/* Continuous Waveform Envelope */}
            <div className="absolute inset-0 flex items-center px-1 pointer-events-none">
              <AudioWaveformVisual
                audioUrl={
                  musicUrl ||
                  (musicTheme?.startsWith("http") ||
                  musicTheme?.startsWith("/") ||
                  musicTheme?.startsWith("blob:")
                    ? musicTheme
                    : undefined)
                }
                seed={`bgm-${musicTheme || musicUrl || ""}`}
                color="#a7f3d0"
                opacity={0.92}
              />
            </div>

            {/* Track Info Badge */}
            <div className="absolute inset-0 flex items-center justify-between px-2.5 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 min-w-0 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 shadow-md group-hover:border-emerald-400/60 transition-colors">
                <GripVertical className="h-3.5 w-3.5 text-emerald-300 group-hover:text-white shrink-0 transition-colors" />
                <Music className="h-3 w-3 text-emerald-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
                <span className="text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] truncate">
                  {displayTheme}
                </span>
              </div>

              <div className="flex items-center gap-1 z-20 pointer-events-auto" style={{ cursor: "inherit" }}>
                {/* Live Drag Delta Display */}
                {movingInfo && movingInfo.deltaPx !== 0 && (
                  <span className="text-[7.5px] font-mono font-bold text-emerald-100 bg-emerald-900/90 px-1.5 py-0.5 rounded-md border border-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse">
                    {movingInfo.deltaPx > 0
                      ? `+${(movingInfo.deltaPx / 30).toFixed(1)}s`
                      : `${(movingInfo.deltaPx / 30).toFixed(1)}s`}
                  </span>
                )}

                {resizingSide !== null && deltaSecs !== 0 && (
                  <span className="text-[7px] font-mono font-bold text-emerald-200 bg-emerald-950 px-1.5 py-0.5 rounded-md border border-emerald-400/50 animate-pulse">
                    {deltaSecs > 0 ? `+${deltaSecs.toFixed(1)}s` : `${deltaSecs.toFixed(1)}s`}
                  </span>
                )}
                <span className="text-[8px] font-mono text-emerald-100 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md border border-white/15 shrink-0 font-bold">
                  {(clipDuration + deltaSecs).toFixed(1)}s
                </span>

                {/* Prominent Glassmorphic Three-Dots Action Menu Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContextMenu(e, "a1-0", 0);
                  }}
                  className="group/btn h-5 px-1.5 flex items-center justify-center rounded-md bg-[#0c0c16]/85 hover:bg-emerald-600 text-neutral-300 hover:text-white border border-white/20 hover:border-emerald-300 shadow-[0_2px_6px_rgba(0,0,0,0.7)] hover:shadow-[0_0_12px_rgba(110,231,183,0.7)] backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                  title="Music Options"
                >
                  <MoreHorizontal className="h-3 w-3 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Dual Left & Right Drag-to-Resize Handles */}
            <ClipTrimHandles
              clipKey="a1-0"
              duration={clipDuration}
              isResizing={resizingSide !== null}
              activeSide={resizingSide}
              onResizeStart={(e, side, d) => handleResizeStart(e, side, d)}
              accentColor="emerald"
            />
          </div>
        )}
      </div>

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddMusic}
          className="w-full h-8 rounded-md border border-emerald-500/30 hover:border-emerald-400/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(52,211,153,0.35)] select-none group/add"
          title="Add Background Music"
        >
          <Music className="h-3 w-3 text-emerald-400 group-hover/add:scale-110 transition-transform" />
          <span>Add BGM</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineMusicTrack);
