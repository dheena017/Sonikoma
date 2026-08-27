// ─── TimelineVoiceoverTrack (A3 Voiceover Track) ──────────────────────────────
// Canonical location: timeline/components/tracks/TimelineVoiceoverTrack.tsx

import React, { useState } from "react";
import TrackLabel from "../TrackLabel";
import { Mic, Volume2, Plus } from "lucide-react";
import { PanelTiming } from "./TimelineStoryPanelsTrack";
import AudioWaveformVisual from "../AudioWaveformVisual";
import ClipTrimHandles from "../ClipTrimHandles";

export interface TimelineVoiceoverTrackProps {
  panels: any[];
  panelTimings?: PanelTiming[];
  totalPanels?: number;
  voiceActor?: string;
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
  onAddVoice?: () => void;
}

export const TimelineVoiceoverTrack: React.FC<TimelineVoiceoverTrackProps> = ({
  panels = [],
  panelTimings = [],
  voiceActor,
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
  onAddVoice,
}) => {
  const [resizingInfo, setResizingInfo] = useState<{
    key: string;
    side: "left" | "right";
    delta: number;
  } | null>(null);

  const handleResizeStart = (
    e: React.MouseEvent,
    key: string,
    side: "left" | "right",
    currentDuration: number
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setResizingInfo({ key, side, delta: 0 });

    const startX = e.clientX;
    const initialDuration = currentDuration;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaSecs = side === "right" ? deltaX / 30 : -deltaX / 30;
      const nextDuration = Math.max(0.5, Math.min(60, initialDuration + deltaSecs));
      setResizingInfo({ key, side, delta: deltaSecs });
      onDurationChange?.(key, parseFloat(nextDuration.toFixed(1)));
    };

    const onMouseUp = () => {
      setResizingInfo(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const hasAnyVoice = panels.some(
    (p: any) =>
      p.speech_audio_url ||
      p.narrative_audio_url ||
      p.audio_url ||
      p.speech_text ||
      p.narrative ||
      p.dialogue
  );

  return (
    <div
      className={`h-11 border-b border-white/[0.04] flex items-center ${
        muted ? "opacity-40" : ""
      }`}
    >
      <TrackLabel
        id="A3"
        label="Voiceover"
        color="text-purple-300"
        type="audio"
        locked={locked}
        hidden={hidden}
        muted={muted}
        onToggleMute={onToggleMute}
        onToggleLock={onToggleLock}
        onToggleHide={onToggleHide}
        onAdd={onAddVoice}
      />

      <div className="flex-1 relative h-9 mx-1">
        {!hasAnyVoice ? (
          <button
            type="button"
            onClick={onAddVoice}
            className="h-full flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 hover:text-purple-300 italic px-2 hover:bg-purple-950/20 rounded-md transition-colors cursor-pointer"
          >
            <Plus className="h-2.5 w-2.5" />
            <span>+ Add character voice / narration dialogue</span>
          </button>
        ) : (
          panels.map((panel: any, idx: number) => {
            const hasVoiceAudio = !!(
              panel.speech_audio_url ||
              panel.narrative_audio_url ||
              panel.audio_url
            );
            const dialogue =
              panel.speech_text ||
              panel.narrative ||
              panel.dialogue ||
              "";

            if (!hasVoiceAudio && !dialogue) return null;

            const timing: PanelTiming = panelTimings[idx] ?? {
              index: idx,
              duration: panel.duration || 3.5,
              startTime: 0,
              endTime: panel.duration || 3.5,
              startPct: (idx / Math.max(panels.length, 1)) * 100,
              widthPct: (1 / Math.max(panels.length, 1)) * 100,
              startPx: 0,
              widthPx: (panel.duration || 3.5) * 30,
            };

            const speaker =
              panel.speaker_name ||
              panel.character_name ||
              (voiceActor ? voiceActor.split("—")[0].trim() : "VO");
            const label = dialogue ? `"${dialogue}"` : `${speaker} P#${idx + 1}`;
            const key = `a3-${idx}`;
            const isResizing = resizingInfo?.key === key;
            const dur = panel.voice_duration ?? timing.duration ?? 3.5;
            const clipWidthPx = dur * 30;

            return (
              <div
                key={key}
                onClick={() => onClipClick(key, idx)}
                onContextMenu={(e) => onContextMenu(e, key, idx)}
                className={`group absolute top-0 bottom-0 rounded-md overflow-hidden cursor-pointer transition-all border select-none ${
                  isResizing
                    ? "ring-2 ring-purple-300 border-purple-300 shadow-[0_0_24px_rgba(192,132,252,0.8)] z-30 brightness-115"
                    : selectedClip === key
                    ? "ring-2 ring-purple-400 border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)] z-20"
                    : "border-purple-600/50 hover:border-purple-300/80"
                } bg-[#6b21a8]`}
                style={{
                  left:
                    timing.startPx !== undefined
                      ? `${timing.startPx}px`
                      : `${timing.startPct}%`,
                  width: `${Math.max(24, clipWidthPx - 3)}px`,
                }}
                title={`Panel #${idx + 1} Voice: ${label} (${dur.toFixed(1)}s)`}
              >
                {/* Continuous Lilac Waveform Envelope matching reference */}
                <div className="absolute inset-0 flex items-center px-1">
                  <AudioWaveformVisual
                    audioUrl={
                      panel.speech_audio_url ||
                      panel.narrative_audio_url ||
                      panel.audio_url ||
                      panel.voice_url
                    }
                    seed={`voice-${idx}-${dialogue}`}
                    color="#d8b4fe"
                    opacity={0.92}
                  />
                </div>

                {/* Overlay Speaker / Dialogue Label with Drop Shadow */}
                <div className="absolute inset-0 flex items-center justify-between px-2.5 z-10 pointer-events-none">
                  <div className="flex items-center gap-1.5 min-w-0 truncate">
                    {hasVoiceAudio ? (
                      <Volume2 className="h-3 w-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
                    ) : (
                      <Mic className="h-3 w-3 text-purple-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] shrink-0" />
                    )}
                    <span className="truncate text-[9px] font-mono font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 z-20 pointer-events-auto">
                    {isResizing && resizingInfo.delta !== 0 && (
                      <span className="text-[7px] font-mono font-bold text-purple-200 bg-purple-950 px-1 py-0.2 rounded-sm border border-purple-400/50 animate-pulse">
                        {resizingInfo.delta > 0 ? `+${resizingInfo.delta.toFixed(1)}s` : `${resizingInfo.delta.toFixed(1)}s`}
                      </span>
                    )}
                    <span className="text-[8px] font-mono font-bold text-purple-100 bg-black/50 px-1 py-0.2 rounded-sm border border-white/10 shrink-0">
                      {dur.toFixed(1)}s
                    </span>

                    {/* Prominent Three-Dots Action Menu Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onContextMenu(e, key, idx);
                      }}
                      className="h-4 px-1 flex items-center justify-center rounded bg-black/70 hover:bg-purple-600 text-neutral-200 hover:text-white border border-white/20 hover:border-purple-400 shadow-sm transition-all cursor-pointer"
                      title="Voiceover Options"
                    >
                      <span className="font-bold text-[10px] tracking-widest leading-none px-0.5">···</span>
                    </button>
                  </div>
                </div>

                {/* Dual Left & Right Drag-to-Resize Handles */}
                <ClipTrimHandles
                  clipKey={key}
                  duration={dur}
                  isResizing={isResizing}
                  activeSide={isResizing ? resizingInfo.side : null}
                  onResizeStart={(e, side, d) => handleResizeStart(e, key, side, d)}
                  accentColor="purple"
                />
              </div>
            );
          })
        )}
      </div>

      {/* Right Side Pinned Action Column matching Left Track Header */}
      <div className="w-32 shrink-0 h-full sticky right-0 z-20 flex items-center justify-center px-2.5 bg-[#0d0d16] border-l border-white/10 shadow-[-3px_0_12px_rgba(0,0,0,0.6)]">
        <button
          type="button"
          onClick={onAddVoice}
          className="w-full h-8 rounded-md border border-purple-500/30 hover:border-purple-400/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono font-bold text-[9px] shadow-sm hover:shadow-[0_0_14px_rgba(168,85,247,0.35)] select-none group/add"
          title="Add Voiceover"
        >
          <Mic className="h-3 w-3 text-purple-400 group-hover/add:scale-110 transition-transform" />
          <span>Add Voice</span>
        </button>
      </div>
    </div>
  );
};

export default React.memo(TimelineVoiceoverTrack);
