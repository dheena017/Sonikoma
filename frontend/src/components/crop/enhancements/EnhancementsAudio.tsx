import React from "react";
import { Type, Volume2 } from "lucide-react";

interface EnhancementsAudioProps {
  activeStoryboardPanel: any;
  handleModifySpeechText: (panelId: number, val: string) => void;
  handleModifySfx: (panelId: number, val: string) => void;
}

export function EnhancementsAudio({
  activeStoryboardPanel,
  handleModifySpeechText,
  handleModifySfx,
}: EnhancementsAudioProps) {
  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center gap-2">
        <div className="p-1 rounded-lg bg-pink-500/10 border border-pink-500/15">
          <Type className="h-3 w-3 text-pink-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Speech & SFX Audio
        </span>
      </div>

      {/* Speech text narration input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
          Dialogue / Narration Subtitle
        </label>
        <textarea
          value={activeStoryboardPanel?.speech_text || ""}
          disabled={!activeStoryboardPanel}
          onChange={(e) =>
            activeStoryboardPanel &&
            handleModifySpeechText(activeStoryboardPanel.id, e.target.value)
          }
          className="w-full h-16 bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed resize-none"
          placeholder=""
        />
      </div>

      {/* SFX tag input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-bold text-neutral-600 uppercase font-mono block tracking-widest">
          Sound Effect (SFX) Tag
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={activeStoryboardPanel?.sfx || ""}
            disabled={!activeStoryboardPanel}
            onChange={(e) =>
              activeStoryboardPanel &&
              handleModifySfx(activeStoryboardPanel.id, e.target.value)
            }
            className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl pl-7 pr-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 disabled:opacity-40 disabled:cursor-not-allowed"
            placeholder=""
          />
          <Volume2 className="absolute left-2.5 h-3 w-3 text-neutral-500 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
