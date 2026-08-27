import React from "react";
import { Sparkles, Wand2, Volume2, Camera, Clock } from "lucide-react";

interface StoryboardAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const StoryboardAiToolbar: React.FC<StoryboardAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3.5 py-2 border-b border-purple-900/15 bg-black/40 flex items-center gap-1.5 overflow-x-auto mini-sidebar-scrollbar">
      <div className="flex items-center gap-1 text-[10px] text-purple-300/80 font-mono pr-2 shrink-0">
        <Sparkles className="h-3 w-3 text-purple-400" />
        <span>Director AI:</span>
      </div>

      <button
        type="button"
        onClick={() => onTriggerFeedback("Auto-Cinematic Camera motion generated")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Camera className="h-3 w-3 text-purple-400" />
        <span>Auto Camera</span>
      </button>

      <button
        type="button"
        onClick={() => onTriggerFeedback("AI Dialogue Script generator opened")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Wand2 className="h-3 w-3 text-purple-400" />
        <span>Gen Script</span>
      </button>

      <button
        type="button"
        onClick={() => onTriggerFeedback("AI Voice Narration studio opened")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Volume2 className="h-3 w-3 text-purple-400" />
        <span>TTS Voices</span>
      </button>
    </div>
  );
};

export default StoryboardAiToolbar;
