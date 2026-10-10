import React, { useState, useEffect } from "react";
import {
  Volume2,
  Play,
  Pause,
  Headphones,
  Sliders,
  Sparkles,
  Check,
  Globe,
  Radio,
} from "lucide-react";

interface VoiceStudioShowcaseProps {
  themeMode?: "dark" | "light";
  onGetStarted: () => void;
}

interface VoiceCharacter {
  id: string;
  name: string;
  archetype: string;
  avatar: string;
  image: string;
  badge: string;
  badgeColor: string;
  voiceModel: string;
  sampleQuote: string;
  context: string;
  pitch: string;
  pace: string;
  emotion: string;
}

const CHARACTERS: VoiceCharacter[] = [
  {
    id: "protagonist",
    name: "Sung Jin",
    archetype: "Shadow Hunter / Climax",
    avatar: "/demo-action-hero.jpg",
    image: "/demo-action-cleaned.jpg",
    badge: "Deep & Resonant",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    voiceModel: "en-US-ChristopherNeural (Heroic)",
    sampleQuote: "Arise. The darkness no longer belongs to fear... it answers to my command.",
    context: "Battle Climax • Chapter 48",
    pitch: "-3 Semitones (Deep)",
    pace: "1.05x Dynamic",
    emotion: "Commanding & Intense",
  },
  {
    id: "mage",
    name: "Archmage Lyra",
    archetype: "Imperial Sorceress",
    avatar: "/demo-romance.jpg",
    image: "/demo-romance.jpg",
    badge: "Melodic & Elegant",
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    voiceModel: "en-US-JennyNeural (Expressive)",
    sampleQuote: "Cast your eyes upon the northern barrier. Not even ancient dragon fire can shatter this celestial ward.",
    context: "Spells & Incantations • Chapter 22",
    pitch: "+1 Semitone (Bright)",
    pace: "0.95x Poised",
    emotion: "Mystical & Calm",
  },
  {
    id: "narrator",
    name: "The Shadow Monarch",
    archetype: "Dark Sovereign / Ruler",
    avatar: "/demo-monarch.jpg",
    image: "/demo-monarch.jpg",
    badge: "Epic Cinematic",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    voiceModel: "en-US-GuyNeural (Cinematic)",
    sampleQuote: "In the twenty-fourth hour of the eclipse, the stone monolith groaned. All arise before the king.",
    context: "Prologue / Throne Room",
    pitch: "-2 Semitones (Warm)",
    pace: "1.00x Steady",
    emotion: "Solemn & Dramatic",
  },
  {
    id: "rogue",
    name: "Ren - Shadow Blade",
    archetype: "Cyberpunk Ninja",
    avatar: "/demo-cyberpunk.jpg",
    image: "/demo-cyberpunk-cleaned.jpg",
    badge: "Fast & Edgy",
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    voiceModel: "en-US-BrianNeural (Youthful)",
    sampleQuote: "The city waits... only death is certain. You really thought you could land a strike on lightning?",
    context: "Rooftop Duel • Chapter 15",
    pitch: "Default",
    pace: "1.20x Rapid",
    emotion: "Sarcastic & Energetic",
  },
];

export function VoiceStudioShowcase({
  themeMode = "dark",
  onGetStarted,
}: VoiceStudioShowcaseProps) {
  const isLight = themeMode === "light";
  const [selectedChar, setSelectedChar] = useState<VoiceCharacter>(CHARACTERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  // Simulated audio playback progress loop
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 2.5;
        });
      }, 100);
    } else {
      setPlaybackProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSelectCharacter = (char: VoiceCharacter) => {
    setSelectedChar(char);
    setIsPlaying(false);
    setPlaybackProgress(0);
  };

  return (
    <section id="voice-studio" className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-purple-50 border-purple-200 text-purple-700"
                : "bg-purple-500/10 border-purple-500/20 text-purple-400"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>Interactive Voice Audition</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Give Every Character{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-300">
              Their Own Signature Voice
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Forget robotic screen-reader audio. Sonikoma uses neural text-to-speech
            with customizable pitch, timbre, and emotion to cast full voice ensembles
            for your comic chapters.
          </p>
        </div>

        {/* INTERACTIVE VOICE WORKBENCH */}
        <div
          className={`rounded-[32px] border p-6 sm:p-10 backdrop-blur-2xl shadow-2xl transition-all ${
            isLight
              ? "bg-white border-slate-200 shadow-slate-200/60"
              : "bg-[#11131a] border-white/10 shadow-black/80"
          }`}
        >
          {/* TOP CHARACTER SELECTOR CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {CHARACTERS.map((char) => {
              const isSelected = selectedChar.id === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectCharacter(char)}
                  className={`text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? isLight
                        ? "bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-md"
                        : "bg-blue-600/15 border-blue-400 ring-2 ring-blue-400/20 shadow-lg shadow-blue-500/10"
                      : isLight
                      ? "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                      : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] text-neutral-300"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <img
                      src={char.avatar}
                      alt={char.name}
                      className="w-11 h-11 rounded-xl object-cover border border-white/20 shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <h4
                        className={`font-bold text-xs sm:text-sm truncate ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {char.name}
                      </h4>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {char.archetype}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${char.badgeColor}`}
                  >
                    {char.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ACTIVE STUDIO BOARD */}
          <div
            className={`p-6 sm:p-8 rounded-2xl border ${
              isLight
                ? "bg-slate-50 border-slate-200"
                : "bg-[#161822] border-white/10"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              {/* CHARACTER COMIC ARTWORK PREVIEW */}
              <div className="lg:col-span-3 flex justify-center">
                <div className="relative w-44 h-60 rounded-2xl overflow-hidden border-2 border-blue-400/60 shadow-xl group">
                  <img
                    src={selectedChar.image}
                    alt={selectedChar.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
                  <div className="absolute bottom-2 inset-x-2 text-center">
                    <span className="text-white text-xs font-black block truncate">
                      {selectedChar.name}
                    </span>
                    <span className="text-[10px] text-blue-300 font-mono">
                      {selectedChar.archetype}
                    </span>
                  </div>
                </div>
              </div>

              {/* SCRIPT QUOTE & PLAYBACK CONTROLLER */}
              <div className="lg:col-span-5 space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span
                      className={`text-xs font-mono font-bold ${
                        isLight ? "text-slate-600" : "text-neutral-300"
                      }`}
                    >
                      {selectedChar.voiceModel}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold ${
                      isLight
                        ? "bg-slate-200 text-slate-700"
                        : "bg-white/10 text-neutral-300"
                    }`}
                  >
                    {selectedChar.context}
                  </span>
                </div>

                {/* Speech Bubble / Quote Box */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border relative ${
                    isLight
                      ? "bg-white border-slate-200 text-slate-900 shadow-sm"
                      : "bg-[#0f1016] border-white/10 text-neutral-100"
                  }`}
                >
                  <p className="text-sm sm:text-base font-semibold italic leading-relaxed">
                    "{selectedChar.sampleQuote}"
                  </p>
                </div>

                {/* Audio Waveform Equalizer & Play Button */}
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={handleTogglePlay}
                    className="w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer"
                    aria-label={isPlaying ? "Pause voice preview" : "Play voice preview"}
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-white" />
                    ) : (
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono font-bold">
                      <span className={isLight ? "text-slate-700" : "text-neutral-300"}>
                        {isPlaying ? "Auditioning Neural Audio..." : "Click Play to Audition"}
                      </span>
                      <span className="text-blue-400">
                        {isPlaying ? `${Math.round(playbackProgress)}%` : "00:04"}
                      </span>
                    </div>

                    {/* Equalizer Bars Simulation */}
                    <div className="flex items-end gap-1 h-7 px-2 py-1 bg-black/10 dark:bg-black/30 rounded-lg">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const randomHeight = isPlaying
                          ? Math.sin(i * 0.4 + playbackProgress * 0.2) * 10 + 14
                          : 4;
                        return (
                          <div
                            key={i}
                            style={{ height: `${Math.max(4, randomHeight)}px` }}
                            className={`flex-1 rounded-full transition-all duration-150 ${
                              isPlaying
                                ? i % 3 === 0
                                  ? "bg-blue-400"
                                  : i % 2 === 0
                                  ? "bg-cyan-400"
                                  : "bg-indigo-400"
                                : "bg-neutral-600/40"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* VOICE PARAMETERS CONTROL PANEL */}
              <div
                className={`lg:col-span-4 p-5 rounded-2xl border space-y-4 ${
                  isLight
                    ? "bg-white border-slate-200"
                    : "bg-[#0f1016] border-white/10"
                }`}
              >
                <div className="flex items-center gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isLight ? "text-slate-800" : "text-white"
                    }`}
                  >
                    Voice Modulation
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Emotion Tone:</span>
                      <span className="font-bold text-blue-400">
                        {selectedChar.emotion}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-blue-500/20 overflow-hidden">
                      <div className="w-3/4 h-full bg-blue-500" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Pitch Offset:</span>
                      <span className="font-bold text-cyan-400">
                        {selectedChar.pitch}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-cyan-500/20 overflow-hidden">
                      <div className="w-1/2 h-full bg-cyan-500" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-neutral-400 mb-1">
                      <span>Speaking Speed:</span>
                      <span className="font-bold text-purple-400">
                        {selectedChar.pace}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-purple-500/20 overflow-hidden">
                      <div className="w-3/5 h-full bg-purple-500" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={onGetStarted}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cast In Your Project</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
