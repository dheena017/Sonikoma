import React from "react";
import { Wand2, Sparkles, MessageSquare, FastForward } from "lucide-react";

interface StoryAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryAiToolbar: React.FC<StoryAiToolbarProps> = ({ onTriggerFeedback }) => {
  return (
    <div className="px-3 py-2 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-400" /> AI Narrative Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI generating new scene breakdown...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Sparkles className="h-2.5 w-2.5" /> Gen Scene
        </button>
        <button
          onClick={() => onTriggerFeedback("AI writing dialogue for scene...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <MessageSquare className="h-2.5 w-2.5" /> Gen Dialogue
        </button>
        <button
          onClick={() => onTriggerFeedback("AI continuing story plotline...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <FastForward className="h-2.5 w-2.5" /> Continue Story
        </button>
      </div>
    </div>
  );
};
