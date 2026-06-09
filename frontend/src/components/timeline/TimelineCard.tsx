import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { GeneratedPanel } from "../../types";
import { getPanelFilterStyle } from "../../utils";

interface TimelineCardProps {
  panel: GeneratedPanel;
  idx: number;
  currentPanelIndex: number;
  activePreviewTab: "video" | "storyboard";
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "storyboard") => void;
  setPlaybackTime: (time: number) => void;
  analyzingPanelId: number | null;
  handleShiftPanel: (idx: number, dir: "left" | "right") => void;
  panelsLength: number;
  handleModifySpeechText: (id: number, val: string) => void;
  handleModifyMotion: (id: number, val: string) => void;
  handleModifyDuration: (id: number, val: number) => void;
  handleAnalyzePanel: (id: number, url: string) => void;
}

export default function TimelineCard({
  panel,
  idx,
  currentPanelIndex,
  activePreviewTab,
  setCurrentPanelIndex,
  setActivePreviewTab,
  setPlaybackTime,
  analyzingPanelId,
  handleShiftPanel,
  panelsLength,
  handleModifySpeechText,
  handleModifyMotion,
  handleModifyDuration,
  handleAnalyzePanel,
}: TimelineCardProps) {
  const isCurrent =
    idx === currentPanelIndex && activePreviewTab === "storyboard";

  return (
    <div
      className={`w-[220px] sm:w-[260px] shrink-0 rounded-xl border p-3 space-y-2.5 transition-all ${
        isCurrent
          ? "bg-neutral-800/80 border-purple-500 shadow-lg"
          : "bg-neutral-950 border-neutral-800"
      }`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={() => {
          setCurrentPanelIndex(idx);
          setActivePreviewTab("storyboard");
          setPlaybackTime(0);
        }}
        className="relative h-28 sm:h-32 rounded-lg overflow-hidden cursor-pointer select-none bg-neutral-950 border border-neutral-800 flex items-center justify-center group"
      >
        <img
          src={panel.image_url}
          alt={`Panel ${panel.id}`}
          className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
          style={{ filter: getPanelFilterStyle(panel) }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
          }}
        />

        {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
          <div className="absolute inset-0 bg-purple-950/40 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 text-center animate-pulse z-10">
            <Sparkles
              className="h-5 w-5 text-purple-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="text-[9px] font-mono font-bold text-purple-300 mt-1 uppercase tracking-wider">
              Loading...
            </span>
            <div className="scanner-line" />
          </div>
        )}

        {/* Number tag */}
        <div className="absolute top-2 left-2 h-5 w-5 rounded bg-black/80 backdrop-blur flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold border border-purple-900/40">
          #{panel.id}
        </div>

        {/* Reorder Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShiftPanel(idx, "left");
            }}
            disabled={idx === 0}
            className="p-1 rounded bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Left"
          >
            ◀
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleShiftPanel(idx, "right");
            }}
            disabled={idx === panelsLength - 1}
            className="p-1 rounded bg-black/85 hover:bg-neutral-800 border border-white/10 text-neutral-300 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer font-mono text-[8px] leading-none"
            title="Move Panel Right"
          >
            ▶
          </button>
        </div>

        {/* Motion overlay text */}
        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300">
          {panel.motion_type}
        </div>
      </div>

      {/* Text OCR Editable Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
            Dialogue/Subtitle Text
          </label>
          {(panel.isAnalyzing || analyzingPanelId === panel.id) && (
            <span className="text-[9px] font-mono font-bold text-purple-400 animate-pulse flex items-center gap-0.5">
              <span>✦ Loading...</span>
            </span>
          )}
        </div>
        <textarea
          rows={2}
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.speech_text}
          onChange={(e) => handleModifySpeechText(panel.id, e.target.value)}
          className={`w-full bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
              : ""
          }`}
        />
      </div>

      {/* Playback specifications (hidden on small screens to save vertical space) */}
      <div className="hidden sm:grid grid-cols-2 gap-2 pt-1.5 border-t border-neutral-900/80">
        <div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase block">
            Cam Motion
          </span>
          <select
            value={panel.motion_type}
            onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
            className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none"
          >
            <option value="zoom_in">Zoom In</option>
            <option value="zoom_out">Zoom Out</option>
            <option value="pan_right">Pan Right</option>
            <option value="pan_left">Pan Left</option>
            <option value="pan_down">Pan Down</option>
          </select>
        </div>

        <div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase block">
            Timing (sec)
          </span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={1}
              max={15}
              step={0.5}
              value={panel.duration}
              onChange={(e) =>
                handleModifyDuration(
                  panel.id,
                  parseFloat(e.target.value) || 4.0
                )
              }
              className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none"
            />
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={analyzingPanelId === panel.id}
          onClick={() => handleAnalyzePanel(panel.id, panel.image_url)}
          className={`w-full py-1.5 rounded-lg border text-[10px] font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
            analyzingPanelId === panel.id
              ? "bg-purple-900/40 border-purple-500/50 text-purple-200"
              : "bg-purple-950/40 border-purple-800/40 hover:bg-purple-900/60 text-purple-300 hover:border-purple-600"
          }`}
        >
          {analyzingPanelId === panel.id ? (
            <RefreshCw className="h-3 w-3 animate-spin text-purple-400" />
          ) : (
            <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
          )}
          <span className="hidden sm:inline">
            {analyzingPanelId === panel.id
              ? "Analyzing Panel..."
              : "AI Image Analyse"}
          </span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1 font-mono">
        <span className="hidden sm:inline">SFX: {panel.sfx || "None"}</span>
        <span>
          {idx + 1} / {panelsLength}
        </span>
      </div>
    </div>
  );
}
