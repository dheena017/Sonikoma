import React from "react";
import { Wand2, Scissors, Maximize, Sparkles } from "lucide-react";

interface MediaAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const MediaAiToolbar: React.FC<MediaAiToolbarProps> = ({ onTriggerFeedback }) => {
  return (
    <div className="px-3 py-2 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-400" /> AI Media Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI removing image background...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Scissors className="h-2.5 w-2.5" /> Remove BG
        </button>
        <button
          onClick={() => onTriggerFeedback("AI upscaling selected media to 4K...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Maximize className="h-2.5 w-2.5" /> 4K Upscale
        </button>
        <button
          onClick={() => onTriggerFeedback("AI generating panel style variants...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="h-2.5 w-2.5" /> Gen Variants
        </button>
      </div>
    </div>
  );
};
