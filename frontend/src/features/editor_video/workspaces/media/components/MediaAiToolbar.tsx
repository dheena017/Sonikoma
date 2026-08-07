import React from "react";
import { Wand2, Scissors, Maximize, Sparkles } from "lucide-react";

interface MediaAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const MediaAiToolbar: React.FC<MediaAiToolbarProps> = ({ onTriggerFeedback }) => {
  return (
    <div className="px-3 py-2 bg-[#08050e]/95 border-b border-purple-900/25 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-[9px] font-mono font-bold text-purple-300 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-300" /> AI Media Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI removing image background...")}
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Scissors className="h-2.5 w-2.5" /> Remove BG
        </button>
        <button
          onClick={() => onTriggerFeedback("AI upscaling selected media to 4K...")}
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Maximize className="h-2.5 w-2.5" /> 4K Upscale
        </button>
        <button
          onClick={() => onTriggerFeedback("AI generating panel style variants...")}
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="h-2.5 w-2.5" /> Gen Variants
        </button>
      </div>
    </div>
  );
};
