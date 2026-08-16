import React from "react";
import { Wand2, Mic, VolumeX, Radio } from "lucide-react";

interface AudioAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AudioAiToolbar: React.FC<AudioAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-400" /> AI Audio Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI cloning voiceover sample...")}
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Mic className="h-2.5 w-2.5" /> Clone Voice
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI removing noise & boosting audio clarity...")
          }
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <VolumeX className="h-2.5 w-2.5" /> Clean Audio
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI composing custom scene BGM track...")
          }
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Radio className="h-2.5 w-2.5" /> Gen Music
        </button>
      </div>
    </div>
  );
};
