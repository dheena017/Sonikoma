import React from "react";
import { Wand2, Mic, VolumeX, Radio } from "lucide-react";

interface AudioAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const AudioAiToolbar: React.FC<AudioAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-neutral-900/90 border-b border-[#2F2F2F] flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-[#3B82F6] flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-[#3B82F6]" /> AI Audio Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onTriggerFeedback("AI cloning voiceover sample...")}
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Mic className="h-2.5 w-2.5" /> Clone Voice
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI removing noise & boosting audio clarity...")
          }
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <VolumeX className="h-2.5 w-2.5" /> Clean Audio
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI composing custom scene BGM track...")
          }
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Radio className="h-2.5 w-2.5" /> Gen Music
        </button>
      </div>
    </div>
  );
};
