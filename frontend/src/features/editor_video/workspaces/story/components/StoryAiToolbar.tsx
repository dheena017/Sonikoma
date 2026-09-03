import React from "react";
import { Wand2, Sparkles, MessageSquare, FastForward } from "lucide-react";

interface StoryAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryAiToolbar: React.FC<StoryAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-[#08050e]/95 border-b border-[#2F2F2F] flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-[9px] font-mono font-bold text-[#60A5FA] flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-[#60A5FA]" /> AI Narrative Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() =>
            onTriggerFeedback("AI generating new scene breakdown...")
          }
          className="px-2.5 py-1 rounded-2xl bg-[#2A2A2A] hover:bg-[#2A2A2A] text-[#3B82F6] hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#3B82F6]/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="h-2.5 w-2.5" /> Gen Scene
        </button>
        <button
          onClick={() => onTriggerFeedback("AI writing dialogue for scene...")}
          className="px-2.5 py-1 rounded-2xl bg-[#2A2A2A] hover:bg-[#2A2A2A] text-[#3B82F6] hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#3B82F6]/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="h-2.5 w-2.5" /> Gen Dialogue
        </button>
        <button
          onClick={() => onTriggerFeedback("AI continuing story plotline...")}
          className="px-2.5 py-1 rounded-2xl bg-[#2A2A2A] hover:bg-[#2A2A2A] text-[#3B82F6] hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#3B82F6]/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <FastForward className="h-2.5 w-2.5" /> Continue Story
        </button>
      </div>
    </div>
  );
};
