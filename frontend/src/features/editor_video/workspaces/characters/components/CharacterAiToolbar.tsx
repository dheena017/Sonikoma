import React from "react";
import { Wand2, Smile, Activity, Volume2 } from "lucide-react";

interface CharacterAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const CharacterAiToolbar: React.FC<CharacterAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-[#08050e]/95 border-b border-purple-900/25 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <span className="text-[9px] font-mono font-bold text-purple-300 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-300" /> AI Character Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() =>
            onTriggerFeedback("AI generating new facial expression...")
          }
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Smile className="h-2.5 w-2.5" /> Gen Expression
        </button>
        <button
          onClick={() => onTriggerFeedback("AI synthesizing action pose...")}
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Activity className="h-2.5 w-2.5" /> Gen Pose
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI generating character voice line...")
          }
          className="px-2.5 py-1 rounded-2xl bg-purple-900/45 hover:bg-purple-700 text-purple-100 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/25 transition-all cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="h-2.5 w-2.5" /> Gen Voice
        </button>
      </div>
    </div>
  );
};
