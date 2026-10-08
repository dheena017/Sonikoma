import React from "react";
import {
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Maximize2,
  Sparkles,
  MessageSquare,
  Mic,
  Clock,
  Play,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { StoryboardPanel } from "../types";

export interface StoryboardCardProps {
  panel: StoryboardPanel;
  totalPanels: number;
  isAuditioning: boolean;
  onUpdate: (id: string, updates: Partial<StoryboardPanel>) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDuplicate: (panel: StoryboardPanel, index: number) => void;
  onDelete: (id: string) => void;
  onAudition: (
    panelId: string,
    text: string,
    voice?: string,
    audioUrl?: string
  ) => void;
  onAnalyze?: (panelId: string, imageUrl: string) => void;
  onPreviewImage: (imageUrl: string) => void;
  onOpenAssistant?: (panelIndex: number, imageUrl: string) => void;
}

export const StoryboardCard: React.FC<StoryboardCardProps> = ({
  panel,
  totalPanels,
  isAuditioning,
  onUpdate,
  onMove,
  onDuplicate,
  onDelete,
  onAudition,
  onAnalyze,
  onPreviewImage,
}) => {

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl border p-3 transition-all w-full min-w-0 box-border ${
        panel.isAnalyzing
          ? "border-2 border-[#3b82f6] bg-[#1e1e1e] ring-1 ring-[#3b82f6]/50 shadow-lg"
          : panel.enabled
          ? "bg-[#181818] border-[#2f2f2f] hover:border-[#3b82f6]/50 shadow-md"
          : "bg-[#121212]/80 border-[#262626] opacity-60"
      }`}
    >
      {/* ── Top Bar: Selection, Scene #, Duration & Ordering Controls ── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <button
            type="button"
            onClick={() => onUpdate(panel.id, { enabled: !panel.enabled })}
            className="cursor-pointer text-slate-400 hover:text-sky-400 transition-colors shrink-0"
            title={
              panel.enabled
                ? "Exclude from video render"
                : "Include in video render"
            }
          >
            {panel.enabled ? (
              <CheckSquare size={14} className="text-sky-400" />
            ) : (
              <Square size={14} />
            )}
          </button>
          <span className="font-mono text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800/60 px-2 py-0.5 rounded-md shrink-0">
            #{panel.index}
          </span>
          {panel.duration && panel.duration > 0 ? (
            <span className="text-[9px] text-slate-400 font-mono shrink-0">
              {panel.duration.toFixed(1)}s
            </span>
          ) : null}
        </div>

        {/* Ordering & Delete Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onMove(panel.index - 1, "up")}
            disabled={panel.index === 1}
            className="p-1 rounded hover:bg-[#262626] disabled:opacity-20 text-[#9ca3af] hover:text-[#e5e5e5] cursor-pointer transition-colors"
            title="Move Scene Up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove(panel.index - 1, "down")}
            disabled={panel.index === totalPanels}
            className="p-1 rounded hover:bg-[#262626] disabled:opacity-20 text-[#9ca3af] hover:text-[#e5e5e5] cursor-pointer transition-colors"
            title="Move Scene Down"
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(panel, panel.index - 1)}
            className="p-1 rounded hover:bg-[#262626] text-[#9ca3af] hover:text-[#3b82f6] cursor-pointer transition-colors"
            title="Duplicate Scene"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(panel.id)}
            className="p-1 rounded hover:bg-[#2d1519] text-[#9ca3af] hover:text-rose-400 cursor-pointer transition-colors"
            title="Delete Scene"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ── Visual Panel Preview with Motion Overlay ── */}
      <div
        onClick={() => onPreviewImage(panel.imageUrl)}
        className="relative w-full h-36 bg-[#121212] rounded-xl overflow-hidden border border-[#2f2f2f] group cursor-pointer shadow-inner"
        title="Click to view panel full resolution"
      >
        <img
          src={panel.imageUrl}
          alt={`Scene ${panel.index}`}
          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Scene # tag top-left */}
        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/80 text-[9px] font-mono font-bold text-sky-300 border border-sky-900/60 shadow-sm pointer-events-none">
          #{panel.index}
        </div>

        {/* Motion preset badge bottom-right (only shown when set and not auto/none) */}
        {panel.motionPreset &&
          panel.motionPreset !== "" &&
          panel.motionPreset !== "auto" &&
          panel.motionPreset !== "none" && (
            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300 border border-slate-700/60 shadow-sm pointer-events-none">
              {panel.motionPreset.toUpperCase()}
            </div>
          )}

        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Maximize2 size={16} className="text-white drop-shadow-md" />
        </div>

        {/* AI Scanning / Processing Overlay (matches website) */}
        {panel.isAnalyzing && (
          <div className="absolute inset-0 bg-[#0d0d12]/90 flex flex-col items-center justify-center p-2 text-center z-10 rounded-xl select-none border border-neutral-800 pointer-events-none">
            <div className="mb-2 flex items-center justify-center w-7 h-7 rounded-full bg-neutral-900 border border-neutral-700">
              <Loader2 className="h-3.5 w-3.5 text-[#3B82F6] animate-spin" />
            </div>
            <span className="text-[10px] font-semibold font-mono text-neutral-200 uppercase tracking-wider">
              Processing...
            </span>
          </div>
        )}
      </div>

      {/* ── Inline Panel Error Banner ── */}
      {panel.error && (
        <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-950/70 border border-rose-800/80 text-rose-200 text-[10px] leading-snug animate-in fade-in">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle size={12} className="text-rose-400 shrink-0" />
            <span className="truncate">{panel.error}</span>
          </div>
          <button
            type="button"
            onClick={() => onUpdate(panel.id, { error: undefined })}
            className="text-rose-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
            title="Dismiss error"
          >
            <X size={11} />
          </button>
        </div>
      )}

      {/* ── Dialogue & Audio Controls ── */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-1 min-w-0">
          <span className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
            <MessageSquare size={11} className="text-sky-400" />
            <span>Dialogue</span>
          </span>

          <div className="flex items-center gap-1">
            {/* Create Voice button */}
            <button
              type="button"
              onClick={() =>
                onAudition(panel.id, panel.dialogueText, panel.voiceOverride)
              }
              disabled={isAuditioning || panel.isAnalyzing}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-neutral-700/80 bg-neutral-800/90 hover:bg-neutral-750 text-neutral-200 hover:text-white text-[9.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Synthesize dialogue voice"
            >
              <Mic size={9} className="text-[#3B82F6]" />
              <span>Create Voice</span>
            </button>

            {/* Play Audio button */}
            <button
              type="button"
              onClick={() =>
                onAudition(
                  panel.id,
                  panel.dialogueText,
                  panel.voiceOverride,
                  panel.audioUrl
                )
              }
              disabled={isAuditioning || panel.isAnalyzing}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#1e1e1e] hover:bg-[#3b82f6] hover:text-white text-[#3b82f6] border border-[#2f2f2f] text-[9.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              title="Audition voice synthesis"
            >
              <Play size={9} className="fill-current" />
              <span>{isAuditioning ? "Playing..." : "Play Audio"}</span>
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          disabled={panel.isAnalyzing}
          value={panel.dialogueText}
          onChange={(e) =>
            onUpdate(panel.id, { dialogueText: e.target.value })
          }
          placeholder="Text from speech bubbles in image..."
          className={`w-full bg-[#121212] border border-[#2f2f2f] focus:border-[#3b82f6] rounded-xl p-2 text-[11px] text-[#e5e5e5] placeholder-[#6b7280] focus:outline-none resize-none shadow-inner ${
            panel.isAnalyzing
              ? "opacity-60 cursor-not-allowed text-[#60A5FA]"
              : ""
          }`}
        />
      </div>

      {/* ── Bottom Controls: Duration & AI Analyze ── */}
      <div className="flex items-center gap-2 pt-0.5 select-none">
        {/* Duration input */}
        <div className="flex items-center gap-1 bg-[#121212] border border-[#2f2f2f] rounded-xl px-2 py-1.5 h-8 flex-1">
          <Clock size={11} className="text-sky-400 shrink-0" />
          <input
            type="number"
            min={0.5}
            max={60}
            step={0.1}
            disabled={panel.isAnalyzing}
            value={panel.duration && panel.duration > 0 ? panel.duration : ""}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!isNaN(val) && val >= 0) {
                onUpdate(panel.id, { duration: Math.round(val * 10) / 10 });
              } else if (e.target.value === "") {
                onUpdate(panel.id, { duration: 0 });
              }
            }}
            placeholder="Auto"
            className="bg-transparent border-none p-0 text-[10px] font-mono font-bold text-slate-100 w-full outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-slate-500"
          />
          <span className="text-[9px] font-mono text-slate-400 shrink-0">sec</span>
        </div>

        {/* AI Analyze Action Toolbar */}
        {panel.isAnalyzing ? (
          <button
            type="button"
            onClick={() => onUpdate(panel.id, { isAnalyzing: false })}
            className="flex-1 py-1.5 h-8 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-rose-600/20 border-rose-500/50 text-rose-300 shadow-sm active:scale-95"
            title="Stop Analyzing"
          >
            <X className="h-3 w-3 text-rose-400" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(panel.id, panel.imageUrl)}
            className="flex-1 py-1.5 h-8 px-1 rounded-xl border border-[#2f2f2f] bg-[#181818] hover:bg-[#222222] hover:border-[#3b82f6]/60 text-[#e5e5e5] hover:text-[#93c5fd] text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
            title="Analyze Scene with AI"
          >
            <Sparkles className="h-3 w-3 text-[#3b82f6]" />
            <span>Analyze</span>
          </button>
        )}
      </div>
    </div>
  );
};
