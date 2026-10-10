import React, { useState } from "react";
import {
  Film,
  Compass,
  Zap,
  Eye,
  FastForward,
  ChevronRight,
  Play,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

interface MotionPreset {
  id: string;
  name: string;
  tag: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  speed: string;
  bestFor: string;
  fx: string;
}

const PRESETS: MotionPreset[] = [
  {
    id: "scroll",
    name: "Vertical Storyteller Scroll",
    tag: "Manhwa Standard",
    badgeColor: "text-blue-400 border-[#2F2F2F] bg-[#141414]",
    icon: Compass,
    description:
      "A fluid, natural vertical camera glide that replicates thumb-scrolling while dynamically framing speaking characters.",
    speed: "Smooth 60 FPS",
    bestFor: "Long vertical webtoon chapters & pacing scenes",
    fx: "Thumb-drag inertia smoothing",
  },
  {
    id: "punch",
    name: "Impact Clash Punch-Zoom",
    tag: "Action / Shonen",
    badgeColor: "text-amber-400 border-[#2F2F2F] bg-[#141414]",
    icon: Zap,
    description:
      "Rapid optical zoom snap directly into character eyes or strike impacts with micro-vibration camera shake.",
    speed: "High Velocity Snap",
    bestFor: "Explosions, magic spells, cliffhanger reveals",
    fx: "Camera rumble micro-vibrations",
  },
  {
    id: "suspense",
    name: "Dramatic Gutter Reveal",
    tag: "Romance / Mystery",
    badgeColor: "text-purple-400 border-[#2F2F2F] bg-[#141414]",
    icon: Eye,
    description:
      "A deliberate slow creeping tilt downward that conceals the bottom panel until the narrative climax strikes.",
    speed: "Slow & Tense",
    bestFor: "Palace reveals, romance confessions, plot twists",
    fx: "Gutter concealment timing",
  },
  {
    id: "dialogue",
    name: "Two-Shot Dialogue Switch",
    tag: "Sci-Fi / Cyberpunk",
    badgeColor: "text-emerald-400 border-[#2F2F2F] bg-[#141414]",
    icon: FastForward,
    description:
      "Intelligently cuts or pans between conversational characters in rhythm with their transcribed speech bubble lines.",
    speed: "Audio-Beat Synced",
    bestFor: "Character arguments, confessions, banter",
    fx: "Speaker detection focus switch",
  },
];

export default function DashboardMotionPresets() {
  const [selectedPreset, setSelectedPreset] = useState<MotionPreset>(PRESETS[0]);

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 sm:p-6 shadow-md text-left transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
            <Film className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#E5E5E5] tracking-tight">
                2.5D Cinematic Camera Presets
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF] text-[10px] font-mono font-bold">
                Parallax Motion
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Select keyframe camera behaviors to synthesize static manga strips into fluid cinematic videos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateToDashboardPath("/video-editor")}
          className="self-start sm:self-auto text-xs font-mono font-bold text-[#3B82F6] hover:text-blue-400 flex items-center gap-1 transition-colors cursor-pointer group"
        >
          <span>Open Video Timeline</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* 4 Motion Preset Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {PRESETS.map((preset) => {
          const Icon = preset.icon;
          const isSelected = preset.id === selectedPreset.id;
          return (
            <div
              key={preset.id}
              onClick={() => setSelectedPreset(preset)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left ${
                isSelected
                  ? "bg-[#141414] border-[#3B82F6]"
                  : "bg-[#141414] border-[#282828] hover:border-neutral-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="p-2 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] text-[#E5E5E5]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${preset.badgeColor}`}
                  >
                    {preset.tag}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#E5E5E5] mb-1">
                  {preset.name}
                </h4>

                <p className="text-[11px] text-[#9CA3AF] leading-relaxed mb-3 line-clamp-3">
                  {preset.description}
                </p>
              </div>

              <div className="pt-2 border-t border-[#242424] text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Pacing:</span>
                  <span className="text-[#E5E5E5] font-bold">{preset.speed}</span>
                </div>
                <div className="flex justify-between text-[#9CA3AF]">
                  <span>Best For:</span>
                  <span className="text-[#6B7280] truncate max-w-[120px]">{preset.bestFor}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
