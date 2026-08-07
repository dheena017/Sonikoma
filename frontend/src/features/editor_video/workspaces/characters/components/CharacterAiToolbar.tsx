import React from "react";
import { Wand2, Smile, Activity, Volume2 } from "lucide-react";

interface CharacterAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const CharacterAiToolbar: React.FC<CharacterAiToolbarProps> = ({ onTriggerFeedback }) => {
  return (
    <div className="px-3 py-2 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-400" /> AI Character Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI generating new facial expression...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Smile className="h-2.5 w-2.5" /> Gen Expression
        </button>
        <button
          onClick={() => onTriggerFeedback("AI synthesizing action pose...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Activity className="h-2.5 w-2.5" /> Gen Pose
        </button>
        <button
          onClick={() => onTriggerFeedback("AI generating character voice line...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="h-2.5 w-2.5" /> Gen Voice
        </button>
      </div>
    </div>
  );
};
