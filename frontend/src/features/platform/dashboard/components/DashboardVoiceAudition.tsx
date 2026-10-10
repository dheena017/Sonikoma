import React, { useState, useEffect } from "react";
import {
  Mic,
  Play,
  Pause,
  Volume2,
  Headphones,
  Sliders,
  ChevronRight,
  Radio,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

interface VoiceCharacter {
  id: string;
  name: string;
  archetype: string;
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
    archetype: "Shadow Hunter / Heroic",
    badge: "Deep & Resonant",
    badgeColor: "bg-[#141414] text-[#3B82F6] border-[#2F2F2F]",
    voiceModel: "en-US-ChristopherNeural",
    sampleQuote: "Arise. The shadows no longer belong to fear... they answer to my command.",
    context: "Battle Climax • Chapter 48",
    pitch: "-3 Semitones",
    pace: "1.05x Dynamic",
    emotion: "Commanding & Intense",
  },
  {
    id: "mage",
    name: "Archmage Lyra",
    archetype: "Imperial Sorceress",
    badge: "Melodic & Elegant",
    badgeColor: "bg-[#141414] text-purple-400 border-[#2F2F2F]",
    voiceModel: "en-US-JennyNeural",
    sampleQuote: "Cast your eyes upon the northern barrier. Not even dragon fire can shatter this ward.",
    context: "Spells & Incantations • Chapter 22",
    pitch: "+1 Semitone",
    pace: "0.95x Poised",
    emotion: "Mystical & Calm",
  },
  {
    id: "narrator",
    name: "Shadow Monarch",
    archetype: "Dark Sovereign / Ruler",
    badge: "Cinematic Narration",
    badgeColor: "bg-[#141414] text-amber-400 border-[#2F2F2F]",
    voiceModel: "en-US-GuyNeural",
    sampleQuote: "In the twenty-fourth hour of the eclipse, the stone monolith groaned. All arise before the king.",
    context: "Prologue / Throne Room",
    pitch: "-2 Semitones",
    pace: "1.00x Steady",
    emotion: "Solemn & Dramatic",
  },
  {
    id: "rogue",
    name: "Ren - Shadow Blade",
    archetype: "Cyberpunk Ninja",
    badge: "Fast & Edgy",
    badgeColor: "bg-[#141414] text-emerald-400 border-[#2F2F2F]",
    voiceModel: "en-US-BrianNeural",
    sampleQuote: "The city waits... only death is certain. You really thought you could land a strike on lightning?",
    context: "Rooftop Duel • Chapter 15",
    pitch: "Default",
    pace: "1.20x Rapid",
    emotion: "Sarcastic & Energetic",
  },
];

export default function DashboardVoiceAudition() {
  const [selectedChar, setSelectedChar] = useState<VoiceCharacter>(CHARACTERS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 3;
        });
      }, 100);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleSelect = (char: VoiceCharacter) => {
    setSelectedChar(char);
    setIsPlaying(false);
    setProgress(0);
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 sm:p-6 shadow-md text-left transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
            <Headphones className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#E5E5E5] tracking-tight">
                Neural Voice Actor Audition
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF] text-[10px] font-mono font-bold">
                45+ Cast Voices
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Audition AI speech models, cadence presets, and emotional delivery for character dialogues.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateToDashboardPath("/characters")}
          className="self-start sm:self-auto text-xs font-mono font-bold text-[#3B82F6] hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Open Full Voice Studio</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: 4 Character Selectors (4 cols) */}
        <div className="lg:col-span-5 space-y-2">
          {CHARACTERS.map((char) => {
            const isSelected = char.id === selectedChar.id;
            return (
              <button
                key={char.id}
                type="button"
                onClick={() => handleSelect(char)}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "bg-[#141414] border-[#3B82F6] text-white"
                    : "bg-[#141414] border-[#282828] hover:border-neutral-700 text-[#9CA3AF]"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#E5E5E5] truncate">
                      {char.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${char.badgeColor}`}
                    >
                      {char.badge}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6B7280] font-sans block truncate">
                    {char.archetype}
                  </span>
                </div>

                <div className="p-1.5 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] shrink-0">
                  <Volume2 className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Active Player & Sample Dialogue (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#282828] flex flex-col justify-between">
          <div>
            {/* Top Bar with Character Info & Model Specs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#242424]">
              <div>
                <span className="text-xs font-bold text-[#E5E5E5]">
                  {selectedChar.name}
                </span>
                <span className="text-[11px] font-mono text-[#6B7280] ml-2">
                  [{selectedChar.voiceModel}]
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#9CA3AF]">
                <span className="px-2 py-0.5 rounded bg-[#1E1E1E] border border-[#2F2F2F]">
                  {selectedChar.pitch}
                </span>
                <span className="px-2 py-0.5 rounded bg-[#1E1E1E] border border-[#2F2F2F]">
                  {selectedChar.pace}
                </span>
              </div>
            </div>

            {/* Quote dialogue block */}
            <div className="p-3.5 rounded-lg bg-[#181818] border border-[#282828] mb-4">
              <span className="text-[10px] font-mono text-[#6B7280] block mb-1">
                Dialogue Scene Sample:
              </span>
              <p className="text-xs sm:text-sm text-[#E5E5E5] font-sans italic leading-relaxed">
                "{selectedChar.sampleQuote}"
              </p>
              <div className="mt-2 text-[10px] font-mono text-[#9CA3AF]">
                Context: {selectedChar.context} • Emotion: {selectedChar.emotion}
              </div>
            </div>
          </div>

          {/* Interactive Player Controls */}
          <div>
            {/* Simulated audio waveform bar */}
            <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden border border-[#2F2F2F] mb-3">
              <div
                className="bg-[#3B82F6] h-full rounded-full transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                className="px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-mono font-bold rounded-xl flex items-center gap-2 transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Audition</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Audition Voice</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigateToDashboardPath("/characters")}
                className="text-xs font-mono font-bold text-[#9CA3AF] hover:text-[#E5E5E5] flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Cast in Studio</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
