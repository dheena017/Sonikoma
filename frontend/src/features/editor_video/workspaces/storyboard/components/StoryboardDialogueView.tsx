import React, { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  Volume2,
  Wand2,
  Check,
  Edit3,
  User,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { GeneratedPanel } from "@/types";

interface StoryboardDialogueViewProps {
  panels: GeneratedPanel[];
  selectedIndices: number[];
  onSelect: (index: number, e: React.MouseEvent) => void;
  onUpdateDialogue: (index: number, text: string) => void;
  onUpdateSpeaker?: (index: number, speaker: string) => void;
  onTriggerFeedback?: (msg: string) => void;
}

const COMMON_SPEAKERS = ["Narrator", "Protagonist", "Antagonist", "System AI", "Supporting Cast"];

export const StoryboardDialogueView: React.FC<StoryboardDialogueViewProps> = ({
  panels,
  selectedIndices,
  onSelect,
  onUpdateDialogue,
  onUpdateSpeaker,
  onTriggerFeedback,
}) => {
  return (
    <div className="space-y-3 pt-1 pb-4">
      {/* Banner / Instructions */}
      <div className="p-2.5 rounded-xl bg-purple-950/30 border border-[#3B82F6]/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-purple-200">
          <MessageSquare className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" />
          <span>Script & Dialogue Director — Edit lines & narration across all panels</span>
        </div>
        <button
          type="button"
          onClick={() => onTriggerFeedback?.("AI Generated dialogue for all empty panels")}
          className="px-2 py-0.5 rounded-md bg-purple-600 hover:bg-[#3B82F6] text-white text-[9px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
        >
          <Wand2 className="h-2.5 w-2.5" />
          <span>Auto-Script</span>
        </button>
      </div>

      {panels.map((panel, index) => {
        const isSelected = selectedIndices.includes(index);
        const imgUrl = panel.image_url || (panel as any).imageUrl || "";
        const displayUrl = getProxiedImageUrl(imgUrl);
        const text = panel.speech_text || panel.narrative || (panel as any).dialogue || "";
        const speaker = panel.speaker_name || panel.character_name || (index % 2 === 0 ? "Narrator" : "Protagonist");

        return (
          <div
            key={`dialogue-row-${panel.id || index}`}
            onClick={(e) => onSelect(index, e)}
            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
              isSelected
                ? "border-[#3B82F6] bg-purple-950/25 ring-2 ring-purple-500/50 shadow-md"
                : "border-white/10 bg-[#0c0d1b] hover:border-[#3B82F6]/40"
            }`}
          >
            {/* Top row: Panel thumbnail + Speaker selector */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[7px] font-black font-mono bg-black/80 text-purple-200 px-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold font-mono text-[#60A5FA]">
                    Panel #{index + 1}
                  </span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-[9px] font-mono text-neutral-300">
                    <User className="h-2.5 w-2.5 text-[#3B82F6]" />
                    <span>{speaker}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newText = text ? `[Dramatic] ${text}` : "Look out! Behind you!";
                    onUpdateDialogue(index, newText);
                    onTriggerFeedback?.(`AI Enhanced line for Panel #${index + 1}`);
                  }}
                  className="px-2 py-0.5 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[8px] font-mono flex items-center gap-1"
                  title="AI Polish Line"
                >
                  <Sparkles className="h-2 w-2 text-[#3B82F6]" />
                  <span>AI Polish</span>
                </button>
              </div>
            </div>

            {/* Large Full-Width Textarea for Dialogue */}
            <textarea
              value={text}
              placeholder="Enter character dialogue, narration line, or subtitles..."
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdateDialogue(index, e.target.value)}
              className="w-full h-16 p-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-[10px] font-mono resize-none focus:outline-none focus:border-[#3B82F6]/60 transition-colors leading-relaxed"
            />
          </div>
        );
      })}
    </div>
  );
};

export default StoryboardDialogueView;
