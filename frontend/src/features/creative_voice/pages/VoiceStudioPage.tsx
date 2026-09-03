import React, { useState, useRef } from "react";
import {
  Mic,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Film,
  Cpu,
  Wand2,
  Users,
  Play,
  Square,
  Volume2,
  Headphones,
  Music2,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import { cleanDialogueDisplay } from "@/utils";
import ScriptDramatizerForm from "@/features/creative_voice/components/ScriptDramatizerForm";
import VoiceSettingsPanel from "@/features/creative_voice/components/VoiceSettingsPanel";
import AmbientSoundPicker from "@/features/editor_audio/components/AmbientSoundPicker";
import SfxOverlayMixer from "@/features/editor_audio/components/SfxOverlayMixer";

import { AIModelSelector } from "@/features/ai_core";

import { useProjectStore } from "@/shared/hooks/useProjectStore";

interface VoiceStudioPageProps {
  panels: GeneratedPanel[];
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedGenre?: string;
  setMusicTheme?: (val: string) => void;
}

const VoiceStudioPage = React.memo(
  ({
    panels,
    setPanels,
    onNavigateHome,
    addNotification,
    scrapedGenre,
    setMusicTheme,
  }: VoiceStudioPageProps) => {
    const activeProjectData = useProjectStore(
      (state) => state.activeProjectData
    );
    const storePanels = activeProjectData?.panels || [];
    const safePanels = (
      panels && panels.length > 0 ? panels : storePanels
    ) as unknown as GeneratedPanel[];

    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<"dramatize" | "cast" | "sound">(
      "dramatize"
    );
    const [selectedModel, setSelectedModel] = useState<string>(
      () => localStorage.getItem("ai_comic_model") || ""
    );

    const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
    const [isPlayingNarrative, setIsPlayingNarrative] = useState(false);
    const speechAudioRef = useRef<HTMLAudioElement | null>(null);
    const narrativeAudioRef = useRef<HTMLAudioElement | null>(null);

    const filmstripRef = useRef<HTMLDivElement>(null);

    const stopAllAudio = () => {
      if (speechAudioRef.current) {
        speechAudioRef.current.pause();
        speechAudioRef.current = null;
      }
      if (narrativeAudioRef.current) {
        narrativeAudioRef.current.pause();
        narrativeAudioRef.current = null;
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingSpeech(false);
      setIsPlayingNarrative(false);
    };

    const activePanel = safePanels[selectedIdx] || safePanels[0];
    const parsedSpeech = cleanDialogueDisplay(activePanel?.speech_text);

    const handlePlaySpeechAudio = () => {
      if (isPlayingSpeech) {
        stopAllAudio();
        return;
      }
      stopAllAudio();
      const targetUrl = activePanel?.audio_url || activePanel?.speech_audio_url;
      if (targetUrl) {
        const audio = new Audio(targetUrl);
        speechAudioRef.current = audio;
        audio.onended = () => setIsPlayingSpeech(false);
        audio
          .play()
          .then(() => setIsPlayingSpeech(true))
          .catch(() => {
            if (
              parsedSpeech.speech &&
              typeof window !== "undefined" &&
              "speechSynthesis" in window
            ) {
              const utter = new SpeechSynthesisUtterance(parsedSpeech.speech);
              utter.onend = () => setIsPlayingSpeech(false);
              window.speechSynthesis.speak(utter);
              setIsPlayingSpeech(true);
            }
          });
      } else if (
        parsedSpeech.speech &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        const utter = new SpeechSynthesisUtterance(parsedSpeech.speech);
        utter.onend = () => setIsPlayingSpeech(false);
        window.speechSynthesis.speak(utter);
        setIsPlayingSpeech(true);
      }
    };

    const handlePlayNarrativeAudio = () => {
      if (isPlayingNarrative) {
        stopAllAudio();
        return;
      }
      stopAllAudio();
      const targetUrl = activePanel?.narrative_audio_url;
      if (targetUrl) {
        const audio = new Audio(targetUrl);
        narrativeAudioRef.current = audio;
        audio.onended = () => setIsPlayingNarrative(false);
        audio
          .play()
          .then(() => setIsPlayingNarrative(true))
          .catch(() => {
            if (
              activePanel?.visual_description &&
              typeof window !== "undefined" &&
              "speechSynthesis" in window
            ) {
              const utter = new SpeechSynthesisUtterance(
                activePanel.visual_description
              );
              utter.onend = () => setIsPlayingNarrative(false);
              window.speechSynthesis.speak(utter);
              setIsPlayingNarrative(true);
            }
          });
      } else if (
        activePanel?.visual_description &&
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        const utter = new SpeechSynthesisUtterance(
          activePanel.visual_description
        );
        utter.onend = () => setIsPlayingNarrative(false);
        window.speechSynthesis.speak(utter);
        setIsPlayingNarrative(true);
      }
    };

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        const scrollAmount = direction === "left" ? -240 : 240;
        filmstripRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    };

    const handleModelChange = (model: string) => {
      setSelectedModel(model);
      localStorage.setItem("ai_comic_model", model);
      addNotification?.(`Switched AI Model to ${model}`, "info");
    };

    const handleLoadDemoPanels = () => {
      if (typeof setPanels === "function") {
        setPanels([
          {
            id: 1,
            prompt: "Dark celestial monarch standing atop ancient ruins",
            duration: 3.5,
            speech_text: "The shadow monarch has awakened from his eternal slumber.",
            visual_description:
              "Dark celestial energy swirls around the armored sovereign standing atop the ruins.",
            image_url: "",
            sfx: "Dark Energy Rumble",
            motion_type: "zoom_in",
          },
          {
            id: 2,
            prompt: "Hunter recoiling in awe as purple lightning strikes",
            duration: 4.0,
            speech_text: "Is this... the true power of the ancient monarchs?",
            visual_description:
              "The hunter recoils in awe as purple lightning illuminates the battlefield.",
            image_url: "",
            sfx: "Lightning Crash",
            motion_type: "pan_right",
          },
          {
            id: 3,
            prompt: "Close up of glowing crimson eyes charging energy",
            duration: 3.0,
            speech_text: "Prepare to perish in the void of darkness.",
            visual_description:
              "Close-up of glowing crimson eyes charging a destructive blast.",
            image_url: "",
            sfx: "Energy Charge",
            motion_type: "static",
          },
        ]);
        addNotification?.("Loaded demo panels for Voice Studio!", "success");
      }
    };

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto py-4 sm:py-6 animate-fade-in text-left text-[#E5E5E5]">
        {/* ── MAIN COVER WRAPPER CARD ── */}
        <div className="rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 lg:p-9 shadow-2xl space-y-8 relative overflow-hidden text-left">
          {/* PAGE HERO HEADER */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#2F2F2F] pb-6">
            <div className="space-y-2 max-w-2xl text-left">
              <h1 className="text-3xl sm:text-4xl font-black text-[#E5E5E5] tracking-tight leading-tight">
                Voice{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] to-[#3B82F6]">
                  Studio
                </span>
              </h1>
              <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed">
                Character voice actor casting, script dramatization, emotional inflection, and neural audio synthesis.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-center">
              {/* Inline AI Model Switcher */}
              <AIModelSelector value={selectedModel} onChange={handleModelChange} />

              <div className="px-3.5 py-1.5 rounded-full bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF] text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                <span>Genre: {scrapedGenre || "Fantasy Action"}</span>
              </div>
            </div>
          </div>

          {safePanels.length === 0 ? (
            /* ── EMPTY STATE INSIDE COVER FRAME ── */
            <div className="p-10 sm:p-14 rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] flex flex-col items-center justify-center text-center shadow-lg animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[#121212] border border-[#2F2F2F] flex items-center justify-center text-[#3B82F6] mb-4 shadow-inner">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-[#E5E5E5] font-sans tracking-tight mb-2">
                No Storyboard Panels Loaded
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed mb-6 font-sans">
                Please import a chapter or open an existing project from your dashboard to cast voice actors, dramatize scripts, and synthesize audio.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onNavigateHome}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs"
                >
                  <span>Open Dashboard Projects</span>
                </button>
                <button
                  onClick={handleLoadDemoPanels}
                  className="btn-secondary flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Load Interactive Demo Panels</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TOP SECTION: HORIZONTAL PANEL CAROUSEL RIBBON */}
              <div className="relative flex items-center gap-4 bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-3 shadow-md">
          <button
            onClick={() => scrollFilmstrip("left")}
            className="p-2.5 text-[#9CA3AF] hover:text-white bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#252525] rounded-xl transition-all shrink-0 cursor-pointer mr-3 shadow-sm"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div
            ref={filmstripRef}
            className="flex items-center gap-3.5 overflow-x-auto py-1.5 scrollbar-none flex-1 scroll-smooth px-1"
          >
            {safePanels.map((p, idx) => {
              const isSel = idx === selectedIdx;
              return (
                <button
                  key={p?.id || idx}
                  onClick={() => setSelectedIdx(idx)}
                  className={`relative flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer group bg-[#121212] flex items-center justify-center ${
                    isSel
                      ? "border-2 border-[#3B82F6] scale-105 bg-[#3B82F6]/10 shadow-md"
                      : "border-[#2F2F2F] opacity-70 hover:opacity-100 hover:border-[#3B82F6]/60 hover:scale-102"
                  }`}
                >
                  {p?.image_url ? (
                    <img
                      src={p.image_url}
                      alt={`Frame ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#121212] flex items-center justify-center text-[10px] text-[#6B7280] font-mono">
                      Panel #{idx + 1}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-[#E5E5E5] border border-[#2F2F2F]">
                    #{idx + 1}
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => scrollFilmstrip("right")}
            className="p-2.5 text-[#9CA3AF] hover:text-white bg-[#121212] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#252525] rounded-xl transition-all shrink-0 cursor-pointer ml-3 shadow-sm"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* TWO-COLUMN STUDIO WORKSPACE GRID (4 : 8) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* COLUMN 1 (LEFT - 4 COLS / 33% WIDTH): ACTIVE PANEL DETAILS */}
          <div className="lg:col-span-4 rounded-2xl border border-neutral-850 bg-neutral-900/60 p-5 space-y-4 shadow-xl">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
              FRAME PREVIEW
            </span>

            {/* Frame Image Container */}
            <div className="h-56 sm:h-64 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center p-2 relative shadow-inner">
              {activePanel?.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${selectedIdx + 1}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Film className="w-8 h-8" />
                  <span className="text-[10px] font-mono">
                    No image rendered
                  </span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[9px] font-mono font-bold text-[#60A5FA] border border-[#3B82F6]/20 shadow-md">
                PANEL #{selectedIdx + 1}
              </div>
            </div>

            {/* Speech & Dialogue */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  SPEECH & DIALOGUE
                </span>
                {activePanel?.speech_text && (
                  <button
                    onClick={handlePlaySpeechAudio}
                    className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isPlayingSpeech
                        ? "bg-[#2A2A2A] text-white border-[#60A5FA] shadow-md shadow-black/50 animate-pulse"
                        : "bg-neutral-900 text-[#60A5FA] border-[#3B82F6]/30 hover:bg-neutral-850 hover:text-white"
                    }`}
                  >
                    {isPlayingSpeech ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>
                      {isPlayingSpeech ? "Stop Audio" : "Play Speech"}
                    </span>
                  </button>
                )}
              </div>
              <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[60px]">
                {parsedSpeech.speech ? (
                  <div className="space-y-1.5">
                    {parsedSpeech.tone && (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30">
                        Tone: {parsedSpeech.tone}
                      </span>
                    )}
                    <p className="text-xs text-neutral-200 font-sans leading-relaxed">
                      {parsedSpeech.speech}
                    </p>
                  </div>
                ) : (
                  <span className="text-neutral-600 italic">
                    No speech text recorded for this panel.
                  </span>
                )}
              </div>
            </div>

            {/* Narrative Text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  NARRATIVE TEXT
                </span>
                {activePanel?.visual_description && (
                  <button
                    onClick={handlePlayNarrativeAudio}
                    className={`px-2.5 py-0.5 rounded-lg border text-[10px] font-mono font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      isPlayingNarrative
                        ? "bg-[#2A2A2A] text-white border-[#60A5FA] shadow-md shadow-black/50 animate-pulse"
                        : "bg-neutral-900 text-[#60A5FA] border-[#3B82F6]/30 hover:bg-neutral-850 hover:text-white"
                    }`}
                  >
                    {isPlayingNarrative ? (
                      <Square className="w-3 h-3 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 fill-current" />
                    )}
                    <span>
                      {isPlayingNarrative ? "Stop Audio" : "Play Narrative"}
                    </span>
                  </button>
                )}
              </div>
              <div className="p-3.5 bg-neutral-950 border border-neutral-850 rounded-xl text-xs text-neutral-200 font-sans leading-relaxed min-h-[60px]">
                {activePanel?.visual_description ? (
                  <p>{activePanel.visual_description}</p>
                ) : (
                  <span className="text-neutral-600 italic">
                    No narrative text recorded for this panel.
                  </span>
                )}
              </div>
            </div>

            {/* Panel Metrics Pills */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-neutral-850">
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">
                  Duration
                </p>
                <p className="text-xs font-black text-white mt-0.5">
                  {(activePanel?.duration ?? 3.0).toFixed(1)}s
                </p>
              </div>
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">
                  Frame
                </p>
                <p className="text-xs font-black text-white mt-0.5">
                  {selectedIdx + 1}/{safePanels.length}
                </p>
              </div>
              <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-2 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase">
                  Audio Track
                </p>
                <p
                  className={`text-xs font-black mt-0.5 ${
                    activePanel?.audio_url || activePanel?.speech_audio_url
                      ? "text-emerald-400"
                      : "text-[#60A5FA]"
                  }`}
                >
                  {activePanel?.audio_url || activePanel?.speech_audio_url
                    ? "TTS Ready"
                    : "TTS Ready"}
                </p>
              </div>
            </div>
          </div>

          {/* COLUMN 2 (RIGHT - 8 COLS / 67% WIDTH): VOICE WORKFLOW CANVAS */}
          <div className="lg:col-span-8 rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-5 shadow-xl flex flex-col min-h-[480px]">
            {/* TABS SELECTOR HEADER */}
            <div className="flex border-b border-[#2F2F2F] mb-5 overflow-x-auto scrollbar-none font-mono">
              <button
                onClick={() => setActiveTab("dramatize")}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "dramatize"
                    ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                    : "border-transparent text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525]"
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>✦ Dialogue Dramatizer</span>
              </button>
              <button
                onClick={() => setActiveTab("cast")}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "cast"
                    ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                    : "border-transparent text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525]"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>✦ Voice Casting Match</span>
              </button>
              <button
                onClick={() => setActiveTab("sound")}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeTab === "sound"
                    ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                    : "border-transparent text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525]"
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>✦ Sound Design & BGM</span>
              </button>
            </div>

            {/* ACTIVE WORKFLOW TAB */}
            <div className="flex-1">
              {activeTab === "dramatize" && (
                <ScriptDramatizerForm
                  panels={panels}
                  setPanels={setPanels}
                  addNotification={addNotification}
                  scrapedGenre={scrapedGenre}
                />
              )}
              {activeTab === "cast" && (
                <VoiceSettingsPanel
                  activePanel={activePanel}
                  selectedIdx={selectedIdx}
                  setPanels={setPanels}
                  addNotification={addNotification}
                />
              )}
              {activeTab === "sound" && (
                <div className="space-y-6 animate-fade-in">
                  <AmbientSoundPicker
                    onSelectMusicTheme={(theme) => {
                      if (setMusicTheme) setMusicTheme(theme);
                      addNotification?.(
                        `Applied soundtrack theme: "${theme}"`,
                        "success"
                      );
                    }}
                  />
                  <SfxOverlayMixer panels={panels} />
                </div>
              )}
            </div>
          </div>
        </div>
            </>
          )}
        </div>
      </div>
  );
}
);

export default VoiceStudioPage;
