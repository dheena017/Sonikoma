import React, { useState, useRef } from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  Zap,
  Sparkles,
  Plus,
  Mic,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { GeneratedPanel } from "@/types";

interface StoryboardAudioViewProps {
  panels: GeneratedPanel[];
  selectedIndices: number[];
  onSelect: (index: number, e: React.MouseEvent) => void;
  onUpdateSfx: (index: number, sfx: string) => void;
  onUpdateBgm: (index: number, bgm: string) => void;
  onTriggerVoiceGen: (index: number) => void;
  onTriggerFeedback?: (msg: string) => void;
}

const COMMON_SFX = ["💥 Boom", "⚡ Whoosh", "🚪 Clunk", "🗡️ Slash", "💨 Wind", "👣 Steps"];
const COMMON_BGM = ["Dramatic Battle", "Suspense Tension", "Eerie Ambient", "Heroic Rise", "Calm Melancholy"];

export const StoryboardAudioView: React.FC<StoryboardAudioViewProps> = ({
  panels,
  selectedIndices,
  onSelect,
  onUpdateSfx,
  onUpdateBgm,
  onTriggerVoiceGen,
  onTriggerFeedback,
}) => {
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingIdx(null);
  };

  const handlePlayAudio = (index: number, panel: GeneratedPanel, e: React.MouseEvent) => {
    e.stopPropagation();

    if (playingIdx === index) {
      stopAudio();
      return;
    }

    stopAudio();

    const audioUrl =
      panel.audio_url ||
      panel.speech_audio_url ||
      panel.narrative_audio_url ||
      (panel as any).voice_url;

    const textToSpeak =
      panel.speech_text ||
      panel.narrative ||
      (panel as any).dialogue ||
      "";

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingIdx(null);
      audio.onerror = () => {
        // Fallback to speech synthesis if audio file url fails
        speakFallback(textToSpeak, index);
      };
      audio
        .play()
        .then(() => setPlayingIdx(index))
        .catch(() => {
          speakFallback(textToSpeak, index);
        });
    } else if (textToSpeak) {
      speakFallback(textToSpeak, index);
    } else {
      onTriggerFeedback?.(`Panel #${index + 1} has no dialogue or audio to play`);
    }
  };

  const speakFallback = (text: string, index: number) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.onend = () => setPlayingIdx(null);
      utterance.onerror = () => setPlayingIdx(null);
      window.speechSynthesis.speak(utterance);
      setPlayingIdx(index);
    } else {
      setPlayingIdx(null);
    }
  };

  return (
    <div className="space-y-3 pt-1 pb-4">
      {/* Banner */}
      <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-200">
          <Volume2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>Audio Studio — Real voice tracks, speech synthesis & sound FX</span>
        </div>
        <button
          type="button"
          onClick={() => onTriggerFeedback?.("Batch TTS Voiceover engine started")}
          className="px-2 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
        >
          <Mic className="h-2.5 w-2.5" />
          <span>Batch TTS</span>
        </button>
      </div>

      {panels.map((panel, index) => {
        const isSelected = selectedIndices.includes(index);
        const imgUrl = panel.image_url || (panel as any).imageUrl || "";
        const displayUrl = getProxiedImageUrl(imgUrl);
        const audioUrl =
          panel.audio_url ||
          panel.speech_audio_url ||
          panel.narrative_audio_url ||
          (panel as any).voice_url;
        const text = panel.speech_text || panel.narrative || (panel as any).dialogue || "";
        const hasAudio = !!audioUrl || !!text;
        const isPlaying = playingIdx === index;
        const currentSfx = panel.sfx || "";
        const currentBgm = panel.bgm_track || "";

        return (
          <div
            key={`audio-row-${panel.id || index}`}
            onClick={(e) => onSelect(index, e)}
            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
              isSelected
                ? "border-emerald-500 bg-emerald-950/25 ring-2 ring-emerald-500/50 shadow-md"
                : "border-white/10 bg-[#0c0d1b] hover:border-emerald-500/40"
            }`}
          >
            {/* Top row: Thumbnail + Voice Player */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[7px] font-black font-mono bg-black/80 text-emerald-200 px-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold font-mono text-emerald-300">
                      Panel #{index + 1}
                    </span>
                    {audioUrl ? (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        AI TTS Synced
                      </span>
                    ) : text ? (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                        Script Ready
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                        No Text
                      </span>
                    )}
                  </div>
                  <p className="text-[8px] font-mono text-neutral-300 truncate max-w-[150px] italic">
                    {text ? `"${text}"` : "No dialogue attached"}
                  </p>
                </div>
              </div>

              {/* Voice Track Playback / Generation Button */}
              {hasAudio ? (
                <button
                  type="button"
                  onClick={(e) => handlePlayAudio(index, panel, e)}
                  className={`px-2.5 py-1 rounded-xl text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                    isPlaying
                      ? "bg-purple-600 text-white animate-pulse "
                      : "bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300"
                  }`}
                >
                  {isPlaying ? (
                    <Pause className="h-3 w-3 fill-white" />
                  ) : (
                    <Play className="h-3 w-3 fill-emerald-300" />
                  )}
                  <span>{isPlaying ? "Playing..." : "Play Audio"}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTriggerVoiceGen(index);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-[#3B82F6] border border-[#3B82F6]/40 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  <span>Gen Voice</span>
                </button>
              )}
            </div>

            {/* Quick SFX Soundboard Pill Selector */}
            <div className="flex items-center gap-1.5 overflow-x-auto mini-sidebar-scrollbar pt-1">
              <span className="text-[8px] font-mono text-neutral-500 shrink-0">SFX:</span>
              {COMMON_SFX.map((sfx) => {
                const isSfxActive = currentSfx === sfx;
                return (
                  <button
                    key={sfx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const next = isSfxActive ? "" : sfx;
                      onUpdateSfx(index, next);
                      onTriggerFeedback?.(next ? `Attached ${sfx} to Panel #${index + 1}` : `Removed SFX`);
                    }}
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-mono whitespace-nowrap transition-all border cursor-pointer ${
                      isSfxActive
                        ? "bg-amber-600/40 border-amber-500 text-amber-200 font-bold"
                        : "bg-black/40 border-white/5 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {sfx}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StoryboardAudioView;
