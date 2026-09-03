import React from "react";
import { Sparkles, Wand2, Volume2, Camera, Clock } from "lucide-react";

interface StoryboardAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryboardAiToolbar: React.FC<StoryboardAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3.5 py-2 border-b border-[#2F2F2F] bg-black/40 flex items-center gap-1.5 overflow-x-auto mini-sidebar-scrollbar">
      <div className="flex items-center gap-1 text-[10px] text-[#60A5FA]/80 font-mono pr-2 shrink-0">
        <Sparkles className="h-3 w-3 text-[#3B82F6]" />
        <span>Director AI:</span>
      </div>

      <button
        type="button"
        onClick={() => onTriggerFeedback("Auto-Cinematic Camera motion generated")}
        className="px-2.5 py-1 rounded-lg bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Camera className="h-3 w-3 text-[#3B82F6]" />
        <span>Auto Camera</span>
      </button>

      <button
        type="button"
        onClick={() => onTriggerFeedback("AI Dialogue Script generator opened")}
        className="px-2.5 py-1 rounded-lg bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Wand2 className="h-3 w-3 text-[#3B82F6]" />
        <span>Gen Script</span>
      </button>

      <button
        type="button"
        onClick={() => onTriggerFeedback("AI Voice Narration studio opened")}
        className="px-2.5 py-1 rounded-lg bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 border border-[#3B82F6]/20 text-[#3B82F6] text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Volume2 className="h-3 w-3 text-[#3B82F6]" />
        <span>TTS Voices</span>
      </button>
    </div>
  );
};

export default StoryboardAiToolbar;
