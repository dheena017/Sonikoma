import React, { useState, useRef } from "react";
import { Type, Volume2, Play, Pause, Square, FileText } from "lucide-react";

interface EnhancementsAudioProps {
  activeStoryboardPanel: any;
  handleModifySpeechText: (panelId: number, val: string) => void;
  handleModifyNarrative?: (panelId: number, val: string) => void;
  handleModifyVisualDescription?: (panelId: number, val: string) => void;
  handleModifySfx: (panelId: number, val: string) => void;
  setPanels?: React.Dispatch<React.SetStateAction<any[]>>;
}

export function EnhancementsAudio({
  activeStoryboardPanel,
  handleModifySpeechText,
  handleModifyNarrative,
  handleModifyVisualDescription,
  handleModifySfx,
  setPanels,
}: EnhancementsAudioProps) {
  const [isDialoguePlaying, setIsDialoguePlaying] = useState(false);
  const [isDialoguePaused, setIsDialoguePaused] = useState(false);
  const dialogueAudioRef = useRef<HTMLAudioElement | null>(null);

  const [isNarrativePlaying, setIsNarrativePlaying] = useState(false);
  const [isNarrativePaused, setIsNarrativePaused] = useState(false);
  const narrativeAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllAudio = () => {
    if (dialogueAudioRef.current) {
      dialogueAudioRef.current.pause();
      dialogueAudioRef.current = null;
    }
    if (narrativeAudioRef.current) {
      narrativeAudioRef.current.pause();
      narrativeAudioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsDialoguePlaying(false);
    setIsDialoguePaused(false);
    setIsNarrativePlaying(false);
    setIsNarrativePaused(false);
  };

  const speakText = (text: string, onEnd: () => void, onStart: () => void) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
      onStart();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleToggleDialogueAudio = () => {
    if (isDialoguePlaying && !isDialoguePaused) {
      if (dialogueAudioRef.current) dialogueAudioRef.current.pause();
      else if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.pause();
      setIsDialoguePaused(true);
      return;
    }
    if (isDialoguePlaying && isDialoguePaused) {
      if (dialogueAudioRef.current)
        dialogueAudioRef.current.play().catch(console.error);
      else if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.resume();
      setIsDialoguePaused(false);
      return;
    }

    stopAllAudio();
    const targetUrl =
      activeStoryboardPanel?.audio_url ||
      activeStoryboardPanel?.speech_audio_url;
    if (targetUrl) {
      const audio = new Audio(targetUrl);
      dialogueAudioRef.current = audio;
      audio.onended = () => stopAllAudio();
      audio
        .play()
        .then(() => {
          setIsDialoguePlaying(true);
          setIsDialoguePaused(false);
        })
        .catch(() => {
          speakText(
            activeStoryboardPanel?.speech_text || "",
            () => stopAllAudio(),
            () => {
              setIsDialoguePlaying(true);
              setIsDialoguePaused(false);
            }
          );
        });
    } else if (activeStoryboardPanel?.speech_text) {
      speakText(
        activeStoryboardPanel.speech_text,
        () => stopAllAudio(),
        () => {
          setIsDialoguePlaying(true);
          setIsDialoguePaused(false);
        }
      );
    }
  };

  const handleToggleNarrativeAudio = () => {
    if (isNarrativePlaying && !isNarrativePaused) {
      if (narrativeAudioRef.current) narrativeAudioRef.current.pause();
      else if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.pause();
      setIsNarrativePaused(true);
      return;
    }
    if (isNarrativePlaying && isNarrativePaused) {
      if (narrativeAudioRef.current)
        narrativeAudioRef.current.play().catch(console.error);
      else if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.resume();
      setIsNarrativePaused(false);
      return;
    }

    stopAllAudio();
    if (activeStoryboardPanel?.narrative) {
      speakText(
        activeStoryboardPanel.narrative,
        () => stopAllAudio(),
        () => {
          setIsNarrativePlaying(true);
          setIsNarrativePaused(false);
        }
      );
    }
  };

  const handleToggleShake = () => {
    if (!setPanels || !activeStoryboardPanel) return;
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
          Dialogue, Story & Audio
        </span>
      </div>

      {/* 1. DIALOGUE / SUBTITLE TEXT */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
            DIALOGUE / SUBTITLE TEXT
          </label>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleDialogueAudio}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-sm ${
                isDialoguePlaying && !isDialoguePaused
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60"
                  : isDialoguePaused
                  ? "bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/60"
                  : "bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 hover:text-indigo-200"
              }`}
            >
              {isDialoguePlaying && !isDialoguePaused ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : isDialoguePaused ? (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
            {(isDialoguePlaying || isDialoguePaused) && (
              <button
                type="button"
                onClick={stopAllAudio}
                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 shadow-sm"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
        <textarea
          rows={2}
          value={activeStoryboardPanel?.speech_text || ""}
          onChange={(e) =>
            handleModifySpeechText(
              activeStoryboardPanel?.id ?? 0,
              e.target.value
            )
          }
          className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 resize-none"
          placeholder=""
        />
      </div>

      {/* 2. NARRATIVE TEXT */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
            NARRATIVE TEXT
          </label>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleToggleNarrativeAudio}
              className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer border shadow-sm ${
                isNarrativePlaying && !isNarrativePaused
                  ? "bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/60"
                  : isNarrativePaused
                  ? "bg-purple-950/40 border-purple-500/40 text-purple-300 hover:bg-purple-900/60"
                  : "bg-indigo-950/40 border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 hover:text-indigo-200"
              }`}
            >
              {isNarrativePlaying && !isNarrativePaused ? (
                <>
                  <Pause className="w-2.5 h-2.5 fill-current" />
                  <span>Pause</span>
                </>
              ) : isNarrativePaused ? (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Play className="w-2.5 h-2.5 fill-current" />
                  <span>Play</span>
                </>
              )}
            </button>
            {(isNarrativePlaying || isNarrativePaused) && (
              <button
                type="button"
                onClick={stopAllAudio}
                className="px-2 py-0.5 rounded text-[9px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/60 shadow-sm"
              >
                <Square className="w-2.5 h-2.5 fill-current" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>
        <textarea
          rows={2}
          value={activeStoryboardPanel?.narrative || ""}
          onChange={(e) =>
            handleModifyNarrative?.(
              activeStoryboardPanel?.id ?? 0,
              e.target.value
            )
          }
          className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 resize-none"
          placeholder=""
        />
      </div>

      {/* 3. VISUAL SCENE DESCRIPTION */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          VISUAL SCENE DESCRIPTION
        </label>
        <textarea
          rows={2}
          value={activeStoryboardPanel?.visual_description || ""}
          onChange={(e) =>
            handleModifyVisualDescription?.(
              activeStoryboardPanel?.id ?? 0,
              e.target.value
            )
          }
          className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl px-2.5 py-1.5 text-[10px] focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15 resize-none"
          placeholder=""
        />
      </div>

      {/* SFX tag input */}
      <div className="space-y-1.5">
        <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider block">
          Sound Effect (SFX) Tag
        </label>
        <div className="relative flex items-center">
          <input
            type="text"
            value={activeStoryboardPanel?.sfx || ""}
            onChange={(e) =>
              handleModifySfx(activeStoryboardPanel?.id ?? 0, e.target.value)
            }
            className="w-full bg-black/40 border border-white/8 text-neutral-300 rounded-xl pl-7 pr-2.5 py-1.5 text-[10px] font-mono focus:border-purple-500/50 focus:outline-none transition-colors hover:border-white/15"
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
                Violently shakes the camera/subtitles for dramatic effect during
                loud shouts (&gt;0.85 peak threshold).
              </p>
            </div>
            <button
              onClick={handleToggleShake}
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
