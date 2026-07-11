import React from "react";
import { Type, Volume2 } from "lucide-react";

interface EnhancementsAudioProps {
  activeStoryboardPanel: any;
  handleModifySpeechText: (panelId: number, val: string) => void;
  handleModifySfx: (panelId: number, val: string) => void;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
}

export function EnhancementsAudio({
  activeStoryboardPanel,
  handleModifySpeechText,
  handleModifySfx,
  setPanels,
}: EnhancementsAudioProps) {
  const handleToggleShake = () => {
    if (!activeStoryboardPanel || !setPanels) return;
    setPanels((prev) =>
      prev.map((p) =>
        p.id === activeStoryboardPanel.id
          ? {
              ...p,
              audio_reactive_shake: !p.audio_reactive_shake,
            }
          : p
      )
    );
  };

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

      {/* Audio Reactive Shake Toggle */}
      {setPanels && (
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between bg-black/25 border border-white/5 p-3 rounded-xl">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold text-neutral-300 block">
                Audio-Reactive Shake
              </span>
              <p className="text-[8px] text-neutral-500 font-sans leading-relaxed max-w-[220px]">
                Violently shakes the camera/subtitles for dramatic effect during loud shouts (&gt;0.85 peak threshold).
              </p>
            </div>
            <button
              onClick={handleToggleShake}
              disabled={!activeStoryboardPanel}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none cursor-pointer ${
                activeStoryboardPanel?.audio_reactive_shake
                  ? "bg-purple-600"
                  : "bg-neutral-800"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                  activeStoryboardPanel?.audio_reactive_shake
                    ? "translate-x-4"
                    : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
