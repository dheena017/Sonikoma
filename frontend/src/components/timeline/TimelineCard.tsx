import React from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { GeneratedPanel } from "../../types";
import { getPanelFilterStyle } from "../../utils";

interface TimelineCardProps {
  panel: GeneratedPanel;
  idx: number;
  currentPanelIndex: number;
  activePreviewTab: "video" | "timeline";
  setCurrentPanelIndex: (idx: number) => void;
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  setPlaybackTime: (time: number) => void;
  analyzingPanelId: number | null;
  handleShiftPanel: (idx: number, dir: "left" | "right") => void;
  panelsLength: number;
  handleModifySpeechText: (id: number, val: string) => void;
  handleModifyMotion: (id: number, val: string) => void;
  handleModifyDuration: (id: number, val: number) => void;
  handleModifySFX: (id: number, val: string) => void;
  handleModifyVisualDescription: (id: number, val: string) => void;
  handleAnalyzePanel: (id: number, url: string) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  playStoryboardAudio?: (idx: number) => void;
  onDragStart?: (e: React.DragEvent, index: number) => void;
  onDragOver?: (e: React.DragEvent, index: number) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, index: number) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

const TimelineCard = ({
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
  handleModifySFX,
  handleModifyVisualDescription,
  handleAnalyzePanel,
  isSelected,
  onToggleSelect,
  playStoryboardAudio,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  isDragOver,
}: TimelineCardProps) => {
  const isCurrent =
    idx === currentPanelIndex && activePreviewTab === "timeline";

  const handleDragStartLocal = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    // Prevent dragging if interacting with inputs, textareas, selectors or buttons
    if (
      target.tagName.toLowerCase() === "textarea" ||
      target.tagName.toLowerCase() === "input" ||
      target.tagName.toLowerCase() === "select" ||
      target.tagName.toLowerCase() === "option" ||
      target.tagName.toLowerCase() === "button" ||
      target.closest(".no-drag")
    ) {
      e.preventDefault();
      return;
    }
    if (onDragStart) {
      onDragStart(e, idx);
    }
  };

  return (
    <div
      draggable={true}
      onDragStart={handleDragStartLocal}
      onDragOver={(e) => onDragOver && onDragOver(e, idx)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop && onDrop(e, idx)}
      className={`w-[220px] sm:w-[260px] shrink-0 rounded-xl border p-3 space-y-2.5 transition-all duration-200 ${
        isDragging
          ? "opacity-35 border-dashed border-purple-500/50 bg-neutral-900/20 scale-98"
          : isDragOver
          ? "bg-neutral-900 border-purple-400 scale-102 ring-2 ring-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
          : isCurrent
          ? "bg-neutral-800/80 border-purple-500 shadow-lg"
          : isSelected
          ? "bg-neutral-900 border-purple-600 shadow-md shadow-purple-900/30"
          : "bg-neutral-950 border-neutral-800"
      } cursor-grab active:cursor-grabbing`}
    >
      {/* Image Thumbnail */}
      <div
        onClick={() => {
          console.log(
            `[TimelineCard] Selecting panel #${panel.id} at index ${idx}`
          );
          setCurrentPanelIndex(idx);
          setActivePreviewTab("timeline");
          setPlaybackTime(0);
          onToggleSelect();
          if (playStoryboardAudio) {
            // Delay voice synthesis slightly so the UI state change and outline render instantly
            setTimeout(() => {
              playStoryboardAudio(idx);
            }, 50);
          }
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

        {/* Selection checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className="absolute top-2 left-2 h-5 w-5 rounded flex items-center justify-center z-20 transition-all"
          title={isSelected ? "Deselect panel" : "Select panel for analysis"}
        >
          {isSelected ? (
            <span className="h-4 w-4 rounded bg-purple-500 border border-purple-400 flex items-center justify-center text-white text-[9px] font-bold shadow-lg">
              ✓
            </span>
          ) : (
            <span className="h-4 w-4 rounded border border-neutral-500 bg-black/70 hover:border-purple-400 hover:bg-purple-900/30 transition-all" />
          )}
        </button>

        {/* Number tag */}
        <div className="absolute top-2 left-8 h-5 rounded bg-black/80 backdrop-blur flex items-center justify-center font-mono text-[10px] text-purple-400 font-bold border border-purple-900/40 px-1.5">
          #{panel.id}
        </div>

        {/* Reorder Buttons */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              console.log(`[TimelineCard] Shifting panel #${panel.id} left`);
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
              console.log(`[TimelineCard] Shifting panel #${panel.id} right`);
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
        {panel.motion_type && (
          <div
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] font-mono uppercase tracking-wider text-neutral-300"
          >
            {panel.motion_type}
          </div>
        )}
      </div>

      {/* Dialogue/Subtitle Text OCR Editable Input */}
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
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[11px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed border-purple-900/40 text-purple-300"
              : ""
          }`}
        />
      </div>

      {/* Sound Effect (SFX) Editable Input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          Sound Effect (SFX)
        </label>
        <input
          type="text"
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.sfx || ""}
          onChange={(e) => handleModifySFX(panel.id, e.target.value)}
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[10px] rounded-lg px-2.5 py-1.5 text-neutral-100 outline-none focus:border-purple-500 font-mono transition-all no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
              : ""
          }`}
        />
      </div>

      {/* Visual Scene Description Editable Input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          Visual Scene Description
        </label>
        <textarea
          rows={2}
          disabled={panel.isAnalyzing || analyzingPanelId === panel.id}
          value={panel.visual_description || ""}
          onChange={(e) =>
            handleModifyVisualDescription(panel.id, e.target.value)
          }
          placeholder=""
          className={`w-full bg-neutral-900 border border-neutral-800 text-[10px] rounded-lg p-2 text-neutral-100 outline-none focus:border-purple-500 font-sans transition-all resize-none no-drag ${
            panel.isAnalyzing || analyzingPanelId === panel.id
              ? "opacity-60 cursor-not-allowed text-purple-300 border-purple-900/40"
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
            value={panel.motion_type ?? ""}
            onChange={(e) => handleModifyMotion(panel.id, e.target.value)}
            className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none no-drag"
          >
            <option value="">None</option>
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
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={panel.duration === 0 ? "" : panel.duration}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num) && num >= 0) {
                handleModifyDuration(panel.id, num);
              } else if (e.target.value === "") {
                handleModifyDuration(panel.id, 0);
              }
            }}
            onBlur={(e) => {
              if (e.target.value === "" || parseFloat(e.target.value) <= 0) {
                handleModifyDuration(panel.id, 0);
              }
            }}
            placeholder="0.0"
            className="bg-neutral-900 text-[11px] text-neutral-300 rounded border border-neutral-800 p-1 w-full outline-none text-center font-mono no-drag"
          />
        </div>
      </div>

      <div className="pt-2">
        <button
          type="button"
          disabled={analyzingPanelId === panel.id}
          onClick={() => {
            console.log(
              `[TimelineCard] Manual AI analysis triggered for panel #${panel.id}`
            );
            handleAnalyzePanel(panel.id, panel.image_url);
          }}
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
              : "Analyze Image"}
          </span>
        </button>
      </div>

      <div className="pt-1.5">
        <button
          type="button"
          onClick={() => {
            window.history.pushState({}, "", `/panel-assistant?idx=${idx}`);
            window.dispatchEvent(new Event("popstate"));
          }}
          className="w-full py-1.5 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-850 hover:border-purple-600/50 text-neutral-350 hover:text-purple-300 text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
        >
          <Sparkles className="h-3 w-3 text-purple-400" />
          <span>Panel Assistant</span>
        </button>
      </div>

      <div className="flex items-center justify-end text-[9px] text-neutral-500 pt-1 font-mono">
        <span>
          {idx + 1} / {panelsLength}
        </span>
      </div>
    </div>
  );
};

export default React.memo(TimelineCard, (prevProps, nextProps) => {
  return (
    prevProps.panel === nextProps.panel &&
    prevProps.idx === nextProps.idx &&
    prevProps.currentPanelIndex === nextProps.currentPanelIndex &&
    prevProps.activePreviewTab === nextProps.activePreviewTab &&
    prevProps.analyzingPanelId === nextProps.analyzingPanelId &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.isDragOver === nextProps.isDragOver &&
    prevProps.panelsLength === nextProps.panelsLength
  );
});
