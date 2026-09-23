import React, { useState } from "react";
import {
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Volume2,
  Maximize2,
  Sparkles,
  MessageSquare,
  Mic,
  Palette,
  Clock,
  Play,
  Pause,
  RefreshCw,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { StoryboardPanel, MOTION_PRESETS } from "../types";

export interface StoryboardCardProps {
  panel: StoryboardPanel;
  totalPanels: number;
  isAuditioning: boolean;
  onUpdate: (id: string, updates: Partial<StoryboardPanel>) => void;
  onMove: (index: number, direction: "up" | "down") => void;
  onDuplicate: (panel: StoryboardPanel, index: number) => void;
  onDelete: (id: string) => void;
  onAudition: (panelId: string, text: string, voice?: string, audioUrl?: string) => void;
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
  const [activeTab, setActiveTab] = useState<"speech" | "narrative" | "sfx" | "scene">("speech");

  // Auto-calculate suggested duration based on dialogue length
  const getSuggestedDuration = (text: string) => {
    if (!text || text.trim().length === 0) return 3.0;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const computed = wordCount * 0.42 + 1.2;
    return Math.min(8.0, Math.max(1.5, Math.round(computed * 2) / 2));
  };

  const suggestedDuration = getSuggestedDuration(panel.dialogueText);

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-2xl border p-3 transition-all w-full min-w-0 box-border ${
        panel.isAnalyzing
          ? "border-2 border-[#3B82F6] bg-[#1a1a24] ring-1 ring-[#3B82F6]/50 shadow-lg"
          : panel.enabled
          ? "bg-[#101420] border-[#1e293b] hover:border-sky-500/50 shadow-md"
          : "bg-[#0b0e17]/70 border-[#151d2a] opacity-60"
      }`}
    >
      {/* ── Top Bar: Selection, Scene #, Duration & Ordering Controls ── */}
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center gap-2 min-w-0 truncate">
          <button
            type="button"
            onClick={() => onUpdate(panel.id, { enabled: !panel.enabled })}
            className="cursor-pointer text-slate-400 hover:text-sky-400 transition-colors shrink-0"
            title={panel.enabled ? "Exclude from video render" : "Include in video render"}
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
          <span className="text-[9px] text-slate-400 font-mono shrink-0">
            {panel.duration}s
          </span>
        </div>

        {/* Ordering & Delete Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onMove(panel.index - 1, "up")}
            disabled={panel.index === 1}
            className="p-1 rounded hover:bg-[#1e293b] disabled:opacity-20 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Move Scene Up"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove(panel.index - 1, "down")}
            disabled={panel.index === totalPanels}
            className="p-1 rounded hover:bg-[#1e293b] disabled:opacity-20 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
            title="Move Scene Down"
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(panel, panel.index - 1)}
            className="p-1 rounded hover:bg-[#1e293b] text-slate-400 hover:text-sky-300 cursor-pointer transition-colors"
            title="Duplicate Scene"
          >
            <Copy size={12} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(panel.id)}
            className="p-1 rounded hover:bg-[#34161b] text-slate-400 hover:text-rose-400 cursor-pointer transition-colors"
            title="Delete Scene"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ── Visual Panel Preview with Motion Overlay ── */}
      <div
        onClick={() => onPreviewImage(panel.imageUrl)}
        className="relative w-full h-36 bg-[#070a12] rounded-xl overflow-hidden border border-[#1e293b] group cursor-pointer shadow-inner"
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

        {/* Motion preset badge bottom-right */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-300 border border-slate-700/60 shadow-sm pointer-events-none">
          {panel.motionPreset.toUpperCase()}
        </div>

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

      {/* ── Category Tabs: Dialogue, Narrator, SFX, Scene ── */}
      <div className="grid grid-cols-4 gap-1 p-0.5 rounded-xl bg-[#0a0e18] border border-[#1e293b] select-none">
        <button
          type="button"
          onClick={() => setActiveTab("speech")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
            activeTab === "speech"
              ? "bg-blue-600 text-white shadow font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141d2f]"
          }`}
        >
          <MessageSquare size={11} className="shrink-0" />
          <span>Dialogue</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("narrative")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
            activeTab === "narrative"
              ? "bg-purple-600 text-white shadow font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141d2f]"
          }`}
        >
          <Mic size={11} className="shrink-0" />
          <span>Narrator</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("sfx")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
            activeTab === "sfx"
              ? "bg-emerald-600 text-white shadow font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141d2f]"
          }`}
        >
          <Volume2 size={11} className="shrink-0" />
          <span>SFX</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("scene")}
          className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] transition-all cursor-pointer ${
            activeTab === "scene"
              ? "bg-amber-600 text-white shadow font-bold"
              : "text-slate-400 hover:text-slate-200 hover:bg-[#141d2f]"
          }`}
        >
          <Palette size={11} className="shrink-0" />
          <span>Scene</span>
        </button>
      </div>

      {/* ── Active Tab Textarea & Sub-Action Bar ── */}
      {activeTab === "speech" && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[10px] font-medium text-slate-300 flex items-center gap-1">
              <MessageSquare size={11} className="text-sky-400" />
              <span>Dialogue</span>
            </span>

            <div className="flex items-center gap-1">
              {/* Create Voice button (matches website) */}
              <button
                type="button"
                onClick={() => onAudition(panel.id, panel.dialogueText, panel.voiceOverride)}
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
                onClick={() => onAudition(panel.id, panel.dialogueText, panel.voiceOverride, panel.audioUrl)}
                disabled={isAuditioning || panel.isAnalyzing}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#162134] hover:bg-sky-600 hover:text-white text-sky-300 border border-[#253752] text-[9.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
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
            onChange={(e) => onUpdate(panel.id, { dialogueText: e.target.value })}
            placeholder="Text from speech bubbles in image..."
            className={`w-full bg-[#0a0d16] border border-[#1e293b] focus:border-sky-500 rounded-xl p-2 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none resize-none shadow-inner ${
              panel.isAnalyzing ? "opacity-60 cursor-not-allowed text-[#60A5FA]" : ""
            }`}
          />
        </div>
      )}

      {activeTab === "narrative" && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[10px] font-medium text-purple-300 flex items-center gap-1">
              <Mic size={11} className="text-purple-400" />
              <span>Narrator</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onAudition(panel.id, panel.narrativeText || panel.dialogueText, panel.voiceOverride)}
                disabled={isAuditioning || panel.isAnalyzing}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg border border-purple-800/60 bg-purple-950/50 hover:bg-purple-900/70 text-purple-200 hover:text-white text-[9.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                title="Synthesize story narration voice"
              >
                <Mic size={9} className="text-purple-400" />
                <span>Create Voice</span>
              </button>

              <button
                type="button"
                onClick={() => onAudition(panel.id, panel.narrativeText || panel.dialogueText, panel.voiceOverride, panel.narrativeAudioUrl)}
                disabled={isAuditioning || panel.isAnalyzing}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-600 hover:text-white text-purple-300 border border-purple-800/60 text-[9.5px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
                title="Play narration audio"
              >
                <Play size={9} className="fill-current" />
                <span>Play Audio</span>
              </button>
            </div>
          </div>

          <textarea
            rows={2}
            disabled={panel.isAnalyzing}
            value={panel.narrativeText || ""}
            onChange={(e) => onUpdate(panel.id, { narrativeText: e.target.value })}
            placeholder="Story narration explaining actions, atmosphere, and context..."
            className={`w-full bg-[#0a0d16] border border-[#1e293b] focus:border-purple-500 rounded-xl p-2 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none resize-none shadow-inner ${
              panel.isAnalyzing ? "opacity-60 cursor-not-allowed text-purple-300" : ""
            }`}
          />
        </div>
      )}

      {activeTab === "sfx" && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
          <span className="text-[10px] font-medium text-emerald-300 flex items-center gap-1">
            <Volume2 size={11} className="text-emerald-400" />
            <span>Sound Effects (SFX Cue)</span>
          </span>
          <input
            type="text"
            disabled={panel.isAnalyzing}
            value={panel.sfx || ""}
            onChange={(e) => onUpdate(panel.id, { sfx: e.target.value })}
            placeholder="e.g. SWOOSH, EXPLOSION, FOOTSTEPS..."
            className={`w-full bg-[#0a0d16] border border-[#1e293b] focus:border-emerald-500 rounded-xl p-2 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none shadow-inner ${
              panel.isAnalyzing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
        </div>
      )}

      {activeTab === "scene" && (
        <div className="flex flex-col gap-1.5 animate-in fade-in duration-150">
          <span className="text-[10px] font-medium text-amber-300 flex items-center gap-1">
            <Palette size={11} className="text-amber-400" />
            <span>Scene Visual Description</span>
          </span>
          <input
            type="text"
            disabled={panel.isAnalyzing}
            value={panel.visualDescription || ""}
            onChange={(e) => onUpdate(panel.id, { visualDescription: e.target.value })}
            placeholder="Scene context description or prompt cues..."
            className={`w-full bg-[#0a0d16] border border-[#1e293b] focus:border-amber-500 rounded-xl p-2 text-[11px] text-slate-100 placeholder-slate-500 focus:outline-none shadow-inner ${
              panel.isAnalyzing ? "opacity-60 cursor-not-allowed" : ""
            }`}
          />
        </div>
      )}

      {/* ── Motion & Duration Control Row ── */}
      <div className="grid grid-cols-2 gap-2 min-w-0">
        {/* Camera Motion */}
        <div className="flex items-center bg-[#0a0e18] border border-[#1e293b] rounded-xl px-2 py-1.5 h-8">
          <select
            disabled={panel.isAnalyzing}
            value={panel.motionPreset}
            onChange={(e) => onUpdate(panel.id, { motionPreset: e.target.value })}
            className="w-full bg-transparent text-[10px] font-semibold text-slate-200 outline-none cursor-pointer truncate disabled:opacity-50"
          >
            {MOTION_PRESETS.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#0b0f19] text-slate-200">
                {m.label.split(" (")[0]}
              </option>
            ))}
          </select>
        </div>

        {/* Duration Counter with Steppers */}
        <div className="flex items-center justify-between bg-[#0a0e18] border border-[#1e293b] rounded-xl px-2 py-1.5 h-8">
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <Clock size={11} className="text-sky-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-slate-100">
              {panel.duration.toFixed(1)}
            </span>
            <span className="text-[9px] font-mono text-slate-400">sec</span>
          </div>

          <div className="flex items-center gap-0.5 border-l border-[#1e293b] pl-1 shrink-0">
            <button
              type="button"
              disabled={panel.isAnalyzing}
              onClick={() =>
                onUpdate(panel.id, { duration: Math.max(1.0, Math.round((panel.duration - 0.5) * 10) / 10) })
              }
              className="w-4 h-4 rounded hover:bg-[#1e293b] text-slate-400 hover:text-white flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors active:scale-90 disabled:opacity-30"
              title="Decrease duration"
            >
              -
            </button>
            <button
              type="button"
              disabled={panel.isAnalyzing}
              onClick={() =>
                onUpdate(panel.id, { duration: Math.min(15.0, Math.round((panel.duration + 0.5) * 10) / 10) })
              }
              className="w-4 h-4 rounded hover:bg-[#1e293b] text-slate-400 hover:text-white flex items-center justify-center text-[11px] font-bold cursor-pointer transition-colors active:scale-90 disabled:opacity-30"
              title="Increase duration"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Analyze Action Toolbar (matches website) ── */}
      <div className="pt-0.5 select-none">
        {panel.isAnalyzing ? (
          <button
            type="button"
            onClick={() => onUpdate(panel.id, { isAnalyzing: false })}
            className="w-full py-1.5 rounded-xl border text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all bg-rose-600/20 border-rose-500/50 text-rose-300 shadow-sm active:scale-95"
            title="Stop Analyzing"
          >
            <X className="h-3 w-3 text-rose-400" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAnalyze && onAnalyze(panel.id, panel.imageUrl)}
            className="w-full py-1.5 px-1 rounded-xl border border-neutral-800 bg-[#0e1017] hover:bg-neutral-850 hover:border-[#3B82F6]/60 text-neutral-200 hover:text-[#93C5FD] text-[10px] font-mono font-bold flex items-center justify-center gap-1 cursor-pointer transition-all shadow-sm active:scale-95"
            title="Analyze Scene with AI"
          >
            <Sparkles className="h-3 w-3 text-[#3B82F6]" />
            <span>Analyze</span>
          </button>
        )}
      </div>
    </div>
  );
};
