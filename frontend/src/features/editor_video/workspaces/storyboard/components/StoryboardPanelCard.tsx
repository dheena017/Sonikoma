import React, { useState } from "react";
import {
  Check,
  Play,
  Volume2,
  Camera,
  Edit2,
  Trash2,
  Sparkles,
  MessageSquare,
  Clock,
  ChevronDown,
  Layers,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { GeneratedPanel } from "@/types";

export interface StoryboardPanelCardProps {
  panel: GeneratedPanel;
  index: number;
  isSelected: boolean;
  onSelect: (index: number, e: React.MouseEvent) => void;
  onPlayPreview?: (panel: GeneratedPanel, index: number) => void;
  onOpenEditor?: (index: number) => void;
  onDelete?: (index: number) => void;
  onUpdateDialogue?: (index: number, dialogue: string) => void;
}

export const StoryboardPanelCard: React.FC<StoryboardPanelCardProps> = ({
  panel,
  index,
  isSelected,
  onSelect,
  onPlayPreview,
  onOpenEditor,
  onDelete,
  onUpdateDialogue,
}) => {
  const [isEditingDialogue, setIsEditingDialogue] = useState(false);
  const [dialogueText, setDialogueText] = useState(
    panel.speech_text || panel.narrative || (panel as any).dialogue || ""
  );

  const imgUrl = panel.image_url || (panel as any).imageUrl || (panel as any).url || "";
  const displayUrl = getProxiedImageUrl(imgUrl);
  const duration = panel.duration || 3.5;
  const cameraMotion = panel.motion_type || (panel as any).camera_motion || "Slow Zoom In";
  const hasAudio = !!(panel.speech_audio_url || panel.audio_url || panel.sfx);

  const handleDialogueSave = () => {
    setIsEditingDialogue(false);
    onUpdateDialogue?.(index, dialogueText);
  };

  return (
    <div
      onClick={(e) => onSelect(index, e)}
      className={`relative group rounded-2xl overflow-hidden border transition-all flex flex-col cursor-pointer select-none ${
        isSelected
          ? "border-purple-500 bg-purple-950/25 ring-2 ring-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          : "border-white/10 bg-[#090914] hover:border-purple-500/50 shadow-md hover:shadow-[0_8px_25px_rgba(168,85,247,0.2)]"
      }`}
    >
      {/* Top Media Bar & Details */}
      <div className="flex p-2.5 gap-3 bg-[#0e0f1e] border-b border-white/5 items-start">
        {/* Left Thumbnail Image */}
        <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-black/60 shrink-0 border border-white/10 group-hover:border-purple-500/40 transition-colors">
          <img
            src={displayUrl}
            alt={`Panel #${index + 1}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Selection Checkbox */}
          <div
            className={`absolute top-1.5 left-1.5 h-4 w-4 rounded flex items-center justify-center border transition-all z-10 ${
              isSelected
                ? "bg-purple-600 border-purple-400 text-white"
                : "bg-black/60 border-white/20 text-transparent group-hover:border-white/50"
            }`}
          >
            <Check className="h-3 w-3" />
          </div>

          {/* Play Preview Button Overlay */}
          {onPlayPreview && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayPreview(panel, index);
              }}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity hover:bg-purple-900/60"
              title="Preview panel playback"
            >
              <Play className="h-5 w-5 fill-white" />
            </button>
          )}

          {/* Panel # Badge */}
          <span className="absolute bottom-1 right-1 text-[8px] font-black font-mono bg-black/85 text-purple-200 px-1 py-0.5 rounded border border-purple-500/30 backdrop-blur-md">
            #{index + 1}
          </span>
        </div>

        {/* Right Info Section */}
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Header Row: Duration & Camera FX */}
          <div className="flex items-center justify-between gap-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-neutral-300 bg-neutral-900/90 px-2 py-0.5 rounded-md border border-neutral-800">
              <Clock className="h-2.5 w-2.5 text-purple-400" />
              {duration}s
            </span>

            <span className="inline-flex items-center gap-1 text-[9px] font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-500/30 truncate max-w-[120px]">
              <Camera className="h-2.5 w-2.5 text-purple-400 shrink-0" />
              <span className="truncate">{cameraMotion}</span>
            </span>
          </div>

          {/* Dialogue / Script Box */}
          <div className="bg-black/40 rounded-xl p-2 border border-white/5 text-[10px] font-mono text-neutral-300">
            {isEditingDialogue ? (
              <div className="space-y-1" onClick={(e) => e.stopPropagation()}>
                <textarea
                  value={dialogueText}
                  onChange={(e) => setDialogueText(e.target.value)}
                  className="w-full h-12 bg-neutral-900/90 border border-purple-500/50 rounded-lg p-1.5 text-white text-[10px] font-mono resize-none focus:outline-none"
                  autoFocus
                />
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={handleDialogueSave}
                    className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditingDialogue(true);
                }}
                className="hover:text-white transition-colors cursor-text line-clamp-2 min-h-[28px] italic"
                title="Click to edit dialogue / script"
              >
                {dialogueText ? (
                  `"${dialogueText}"`
                ) : (
                  <span className="text-neutral-500 not-italic">
                    + Add dialogue or narration...
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-1.5">
            {hasAudio ? (
              <span className="inline-flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-300 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                <Volume2 className="h-2.5 w-2.5" />
                Audio Synced
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[8px] font-mono text-neutral-500 bg-neutral-900/60 px-1.5 py-0.5 rounded border border-neutral-800">
                <Volume2 className="h-2.5 w-2.5" />
                No Voice
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-2.5 py-1.5 bg-[#090912] flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenEditor?.(index);
          }}
          className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white font-mono text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <Edit2 className="h-2.5 w-2.5" />
          <span>Edit</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(index);
          }}
          className="p-1 px-2 rounded-lg bg-rose-950/30 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 hover:text-rose-100 font-mono text-[9px] font-bold flex items-center gap-1 transition cursor-pointer"
          title="Remove from storyboard"
        >
          <Trash2 className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
};

export default StoryboardPanelCard;
