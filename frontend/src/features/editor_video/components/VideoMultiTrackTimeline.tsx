import React, { useState } from "react";
import {
  Undo,
  Redo,
  Scissors,
  Trash2,
  Copy,
  Lock,
  Eye,
  Volume2,
  Plus,
  Minus,
  Diamond,
} from "lucide-react";

interface VideoMultiTrackTimelineProps {
  panels?: any[];
  currentPanelIndex?: number;
  setCurrentPanelIndex?: (idx: number) => void;
  musicTheme?: string;
}

const VideoMultiTrackTimeline: React.FC<VideoMultiTrackTimelineProps> = ({
  panels = [],
  currentPanelIndex = 0,
  setCurrentPanelIndex,
  musicTheme = "Synthwave Neon",
}) => {
  const [zoomLevel, setZoomLevel] = useState(50);

  // Calculate dynamic playhead position based on currentPanelIndex
  const totalPanels = Math.max(panels.length, 1);
  const playheadPercent = Math.min(
    Math.max(((currentPanelIndex + 0.5) / totalPanels) * 100, 4),
    96
  );

  return (
    <div className="w-full bg-[#08080c] border-t border-neutral-800/80 flex flex-col shrink-0 select-none h-80 z-20">
      {/* Timeline Control Toolbar */}
      <div className="h-10 px-4 border-b border-neutral-800/70 flex items-center justify-between bg-[#0b0b10] shrink-0">
        {/* Editing Tools */}
        <div className="flex items-center gap-1">
          <button
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-900 transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo className="h-3.5 w-3.5" />
          </button>

          <div className="h-4 w-px bg-neutral-800 mx-1" />

          <button
            className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors cursor-pointer font-bold flex items-center gap-1 border border-purple-500/30"
            title="Split Clip (S)"
          >
            <Scissors className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Delete Selected"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Duplicate Clip"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 text-neutral-400 hover:text-purple-400 hover:bg-neutral-900 rounded transition-colors cursor-pointer"
            title="Add Keyframe"
          >
            <Diamond className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Timeline Zoom Control */}
        <div className="flex items-center gap-2">
          <button className="text-neutral-400 hover:text-white cursor-pointer">
            <Minus className="h-3 w-3" />
          </button>
          <input
            type="range"
            min={10}
            max={100}
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-24 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
          <button className="text-neutral-400 hover:text-white cursor-pointer">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Track Workspace & Time Ruler */}
      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-[#06060a]">
        {/* Draggable Full-Height Playhead Marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-40 pointer-events-none transition-all duration-300"
          style={{ left: `calc(9rem + ${playheadPercent}%)` }}
        >
          <div className="absolute top-1 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-purple-500 rotate-45 rounded-xs shadow-[0_0_12px_rgba(168,85,247,1)] border border-purple-300" />
        </div>

        {/* Time Ruler Bar */}
        <div className="h-7 border-b border-neutral-800/80 flex items-center bg-[#09090d] text-[10px] font-mono text-neutral-500 shrink-0 relative">
          <div className="w-36 border-r border-neutral-800/80 shrink-0" />
          <div className="flex-1 relative h-full flex items-center">
            {[
              "00:00",
              "00:05:00",
              "00:10:00",
              "00:15:00",
              "00:20:00",
              "00:25:00",
              "00:30:00",
              "00:35:00",
              "00:40:00",
              "00:45:00",
              "00:50:00",
              "00:55:00",
            ].map((time, idx) => (
              <div
                key={idx}
                className="absolute flex flex-col items-start"
                style={{ left: `${idx * 8.3}%` }}
              >
                <span>{time}</span>
                <div className="h-1.5 w-px bg-neutral-800 mt-0.5" />
              </div>
            ))}
          </div>
        </div>

        {/* Tracks Scrollable Container */}
        <div className="flex-1 overflow-y-auto relative [scrollbar-width:none]">
          {/* V3 OVERLAY TRACK */}
          <div className="h-12 border-b border-neutral-850/80 flex items-center bg-neutral-950/60">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-purple-300 font-bold">V3</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Eye className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">Overlay</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              {panels.map((panel: any, idx: number) => {
                const text = panel.text_narration || panel.dialogue;
                if (!text) return null;
                const widthPct = (1 / totalPanels) * 90;
                const leftPct = (idx / totalPanels) * 90;

                return (
                  <div
                    key={`v3-${panel.id || idx}`}
                    onClick={() => setCurrentPanelIndex?.(idx)}
                    className="absolute h-8 rounded-lg bg-purple-900/60 border border-purple-500/60 text-purple-200 text-xs font-mono font-bold px-2 flex items-center shadow-[0_0_10px_rgba(168,85,247,0.2)] cursor-pointer hover:border-purple-400 truncate"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={text}
                  >
                    <span className="truncate">{text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* V2 VIDEO TRACK */}
          <div className="h-12 border-b border-neutral-850/80 flex items-center bg-neutral-950/40">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-purple-400 font-bold">V2</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Eye className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">Video</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              <div
                className="absolute h-8 rounded-lg bg-indigo-900/50 border border-indigo-500/50 text-indigo-200 text-xs font-mono font-bold px-3 flex items-center cursor-pointer hover:border-indigo-400"
                style={{ left: "15%", width: "20%" }}
              >
                Hologram Overlay
              </div>
              <div
                className="absolute h-8 rounded-lg bg-purple-900/40 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold px-3 flex items-center cursor-pointer hover:border-purple-400"
                style={{ left: "50%", width: "18%" }}
              >
                Glitch Transition
              </div>
            </div>
          </div>

          {/* V1 MAIN VIDEO THUMBNAIL TRACK */}
          <div className="h-14 border-b border-neutral-850/80 flex items-center bg-neutral-950/80">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-purple-400 font-bold">V1</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Eye className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">Video</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              <div className="w-full flex items-center gap-1.5 h-10 overflow-x-auto [scrollbar-width:none]">
                {panels.map((panel: any, idx: number) => {
                  const imgUrl =
                    panel.img_url ||
                    panel.image_url ||
                    panel.panel_url ||
                    panel.src ||
                    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&auto=format&fit=crop&q=60";
                  const isSelected = idx === currentPanelIndex;

                  return (
                    <React.Fragment key={`v1-${panel.id || idx}`}>
                      <div
                        onClick={() => setCurrentPanelIndex?.(idx)}
                        className={`h-full rounded-lg overflow-hidden relative group flex-1 min-w-[90px] max-w-[160px] cursor-pointer transition-all border ${
                          isSelected
                            ? "border-purple-400 ring-2 ring-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                            : "border-purple-500/50 hover:border-purple-400"
                        }`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Panel ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-end p-1">
                          <span className="text-[9px] font-mono font-bold bg-black/80 text-purple-300 px-1 rounded">
                            #{idx + 1}
                          </span>
                        </div>
                      </div>

                      {idx < panels.length - 1 && (
                        <div
                          className="w-4 h-4 rounded bg-neutral-900 border border-neutral-700 text-[8px] font-bold text-neutral-400 flex items-center justify-center cursor-pointer hover:text-white hover:border-purple-500 shrink-0"
                          title="Transition"
                        >
                          ✕
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* A1 MUSIC TRACK (GREEN WAVEFORM) */}
          <div className="h-12 border-b border-neutral-850/80 flex items-center bg-emerald-950/10">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-emerald-400 font-bold">A1</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Volume2 className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">Music</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              <div
                className="absolute h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold px-3 flex items-center justify-between cursor-pointer overflow-hidden"
                style={{ left: "2%", width: "85%" }}
              >
                <span className="relative z-10 truncate">{musicTheme}</span>
                <div className="absolute inset-0 flex items-center gap-0.5 opacity-30 px-2 pointer-events-none">
                  {[
                    40, 70, 30, 90, 50, 100, 60, 80, 40, 90, 30, 60, 80, 40, 90,
                    70, 50, 30, 90, 60, 40, 80, 50, 100, 40, 70, 30, 90, 50,
                  ].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-emerald-400 rounded-full"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* A2 SFX TRACK (CYAN WAVEFORM) */}
          <div className="h-12 border-b border-neutral-850/80 flex items-center bg-cyan-950/10">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-cyan-400 font-bold">A2</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Volume2 className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">SFX</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              <div
                className="absolute h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold px-3 flex items-center cursor-pointer"
                style={{ left: "10%", width: "15%" }}
              >
                Whoosh
              </div>
              <div
                className="absolute h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold px-3 flex items-center cursor-pointer"
                style={{ left: "42%", width: "20%" }}
              >
                Hover Car Pass
              </div>
              <div
                className="absolute h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/60 text-cyan-300 text-xs font-mono font-bold px-3 flex items-center cursor-pointer"
                style={{ left: "72%", width: "18%" }}
              >
                Interface Beep
              </div>
            </div>
          </div>

          {/* A3 VOICEOVER TRACK (BLUE WAVEFORM) */}
          <div className="h-12 border-b border-neutral-850/80 flex items-center bg-blue-950/10">
            <div className="w-36 h-full px-3 bg-[#0a0a0e] border-r border-neutral-850 flex items-center justify-between text-xs font-mono shrink-0">
              <span className="text-blue-400 font-bold">A3</span>
              <div className="flex items-center gap-2 text-neutral-500">
                <Lock className="h-3 w-3 hover:text-white cursor-pointer" />
                <Volume2 className="h-3 w-3 hover:text-white cursor-pointer" />
                <span className="text-[10px] text-neutral-400">Voiceover</span>
              </div>
            </div>
            <div className="flex-1 relative h-full flex items-center px-2">
              <div
                className="absolute h-8 rounded-lg bg-blue-950/80 border border-blue-500/60 text-blue-300 text-xs font-mono font-bold px-3 flex items-center cursor-pointer"
                style={{ left: "0%", width: "65%" }}
              >
                Narration_voiceover.wav
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(VideoMultiTrackTimeline);
