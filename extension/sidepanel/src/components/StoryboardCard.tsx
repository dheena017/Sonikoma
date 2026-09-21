import React from "react";
import {
  CheckSquare,
  Square,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Volume2,
  Maximize2,
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
  onAudition: (panelId: string, text: string, voice?: string) => void;
  onPreviewImage: (imageUrl: string) => void;
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
  onPreviewImage,
}) => {
  // Auto-calculate suggested duration based on dialogue length (words / standard reading speed)
  const getSuggestedDuration = (text: string) => {
    if (!text || text.trim().length === 0) return 3.0;
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const computed = wordCount * 0.42 + 1.2;
    return Math.min(8.0, Math.max(1.5, Math.round(computed * 2) / 2));
  };

  const suggestedDuration = getSuggestedDuration(panel.dialogueText);

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border p-2.5 transition-all w-full min-w-0 box-border ${
        panel.enabled
          ? "bg-[#121827] border-[#1e293b] hover:border-sky-500/50 shadow-sm"
          : "bg-[#0d121e]/60 border-[#182030] opacity-60"
      }`}
    >
      {/* ── Top Bar: Checkbox, Scene Tag, Move Up/Down, Duplicate, Delete ── */}
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
            Scene #{panel.index}
          </span>
          <span className="text-[9px] text-slate-400 font-mono shrink-0">
            {panel.duration}s
          </span>
        </div>

        {/* Action Buttons */}
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

      {/* ── Middle: Image Thumbnail & Dialogue Editor ── */}
      <div className="flex gap-2.5 items-start min-w-0">
        {/* Panel Thumbnail */}
        <div
          onClick={() => onPreviewImage(panel.imageUrl)}
          className="relative w-16 h-20 bg-[#090d16] rounded-lg overflow-hidden shrink-0 border border-[#1e293b] group cursor-pointer shadow-sm"
          title="Click to view panel full resolution"
        >
          <img
            src={panel.imageUrl}
            alt={`Scene ${panel.index}`}
            className="w-full h-full object-cover object-top transition-transform group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <Maximize2 size={12} className="text-white" />
          </div>
        </div>

        {/* Script & Motion Controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <textarea
            rows={2}
            value={panel.dialogueText}
            onChange={(e) => onUpdate(panel.id, { dialogueText: e.target.value })}
            placeholder="Type voice dialogue script..."
            className="w-full bg-[#0c101d] border border-[#1e293b] focus:border-sky-500 rounded-lg p-1.5 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none resize-none shadow-inner"
          />

          <div className="grid grid-cols-2 gap-1.5 min-w-0">
            {/* Camera Motion Preset */}
            <div className="flex flex-col min-w-0">
              <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Camera Motion
              </label>
              <select
                value={panel.motionPreset}
                onChange={(e) => onUpdate(panel.id, { motionPreset: e.target.value })}
                className="w-full bg-[#0c101d] border border-[#1e293b] rounded px-1 py-0.5 text-[9px] text-slate-300 outline-none cursor-pointer mt-0.5 truncate"
              >
                {MOTION_PRESETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label.split(" (")[0]}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration Slider with Auto Button */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-[8px] font-bold text-slate-400 uppercase tracking-wider truncate">
                  Duration
                </label>
                <button
                  type="button"
                  onClick={() => onUpdate(panel.id, { duration: suggestedDuration })}
                  className="text-[8px] text-sky-400 hover:text-sky-200 font-bold bg-sky-950/80 hover:bg-sky-900 border border-sky-800/60 px-1 py-0.2 rounded transition-colors cursor-pointer"
                  title={`Auto-sync duration to dialogue (${suggestedDuration}s)`}
                >
                  ⚡ Auto
                </button>
              </div>
              <div className="flex items-center gap-1 mt-0.5 min-w-0">
                <input
                  type="range"
                  min={1.5}
                  max={8.0}
                  step={0.5}
                  value={panel.duration}
                  onChange={(e) =>
                    onUpdate(panel.id, { duration: parseFloat(e.target.value) })
                  }
                  className="flex-1 min-w-0 accent-sky-500 h-1 bg-[#1e293b] rounded cursor-pointer"
                />
                <span className="text-[9px] font-mono text-slate-300 shrink-0 text-right">
                  {panel.duration}s
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Line: Estimated Dialogue & Audition Button ── */}
      <div className="flex items-center justify-between pt-1 border-t border-[#182236] text-[10px] min-w-0">
        <span className="text-[9px] text-slate-500 font-mono truncate">
          Est. speech: {suggestedDuration}s
        </span>

        <button
          type="button"
          onClick={() => onAudition(panel.id, panel.dialogueText, panel.voiceOverride)}
          disabled={isAuditioning}
          className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#162033] hover:bg-sky-600 hover:text-white text-sky-300 border border-[#253652] text-[10px] font-semibold transition-all cursor-pointer shadow-sm shrink-0"
        >
          <Volume2 size={11} className={isAuditioning ? "animate-pulse" : ""} />
          <span>{isAuditioning ? "Auditioning..." : "Audition Voice"}</span>
        </button>
      </div>
    </div>
  );
};
