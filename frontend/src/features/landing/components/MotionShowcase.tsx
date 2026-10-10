import React, { useState } from "react";
import { Film, Play, Compass, Zap, Eye, FastForward } from "lucide-react";

interface MotionShowcaseProps {
  themeMode?: "dark" | "light";
  onGetStarted: () => void;
}

const MOTION_MODES = [
  {
    id: "scroll",
    name: "Vertical Storyteller Scroll",
    tag: "Manhwa Standard",
    image: "/demo-action-hero.jpg",
    subtitle: "Step back... the dungeon portal is collapsing!",
    soundFx: "[Sound: Thunder Clash & Dimensional Rumbling]",
    icon: <Compass className="w-4 h-4 text-blue-400" />,
    description:
      "A fluid, natural vertical camera glide that replicates the reader's thumb-scroll, keeping key characters framed in the sweet spot.",
    speed: "Smooth 60fps",
    bestFor: "Long vertical webtoon chapters & pacing scenes",
  },
  {
    id: "punch",
    name: "Impact Clash Punch-Zoom",
    tag: "Action / Shonen",
    image: "/demo-monarch.jpg",
    subtitle: "Maximum output! Shatter their defenses!",
    soundFx: "[Sound: High-Velocity Shockwave & Energy Explosion]",
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    description:
      "Rapid optical zoom snap directly into character eyes or weapon impacts with built-in camera rumble micro-vibrations.",
    speed: "High velocity",
    bestFor: "Explosions, magic spells, cliffhanger reveals",
  },
  {
    id: "suspense",
    name: "Dramatic Gutter Reveal",
    tag: "Romance / Mystery",
    image: "/demo-romance.jpg",
    subtitle: "Under the celestial starlight, our fate was sealed.",
    soundFx: "[Sound: Soft Wind & Orchestral Violins]",
    icon: <Eye className="w-4 h-4 text-purple-400" />,
    description:
      "A deliberate, slow creeping tilt downward that hides the bottom panel until the narrative climax strikes.",
    speed: "Slow & Tense",
    bestFor: "Palace reveals, romance moments, shocking discoveries",
  },
  {
    id: "dialogue",
    name: "Two-Shot Dialogue Switch",
    tag: "Sci-Fi / Cyberpunk",
    image: "/demo-cyberpunk.jpg",
    subtitle: "The city waits... only death is certain.",
    soundFx: "[Sound: Neon Rain & Katana Sheathing]",
    icon: <FastForward className="w-4 h-4 text-emerald-400" />,
    description:
      "Intelligently cuts or pans between conversational characters in alternating rhythm with their generated voice lines.",
    speed: "Dialogue synced",
    bestFor: "Character arguments, confessions, comedic banter",
  },
];

export function MotionShowcase({
  themeMode = "dark",
  onGetStarted,
}: MotionShowcaseProps) {
  const isLight = themeMode === "light";
  const [activeMode, setActiveMode] = useState(MOTION_MODES[0]);

  return (
    <section className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Cinematic Motion Presets</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Camera Movement That Feels Like{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300">
              An Anime Studio
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            No keyframing required. Choose dynamic camera styles engineered by
            video editors to maximize retention on mobile feeds.
          </p>
        </div>

        {/* INTERACTIVE MOTION VIEWER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* LEFT: MOTION SELECTOR CARDS */}
          <div className="lg:col-span-5 space-y-3">
            {MOTION_MODES.map((mode) => {
              const isSelected = activeMode.id === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() => setActiveMode(mode)}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-white border-blue-500 shadow-md ring-2 ring-blue-500/15"
                        : "bg-[#161822] border-blue-400/80 shadow-lg shadow-blue-500/10 ring-2 ring-blue-400/20"
                      : isLight
                      ? "bg-white/60 border-slate-200 hover:bg-white hover:border-slate-300"
                      : "bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-2 rounded-xl border ${
                          isLight
                            ? "bg-slate-100 border-slate-200"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        {mode.icon}
                      </div>
                      <h4
                        className={`font-bold text-sm ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}
                      >
                        {mode.name}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        isSelected
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                          : isLight
                          ? "bg-slate-100 text-slate-600 border-slate-200"
                          : "bg-white/5 text-neutral-400 border-white/10"
                      }`}
                    >
                      {mode.tag}
                    </span>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isLight ? "text-slate-600" : "text-neutral-400"
                    }`}
                  >
                    {mode.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 pt-2 border-t border-black/5 dark:border-white/5">
                    <span>Speed: <strong className="text-blue-400">{mode.speed}</strong></span>
                    <span className="truncate max-w-[180px]">Best: {mode.bestFor}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT: SIMULATED MOBILE PHONE VIEWPORT */}
          <div className="lg:col-span-7 flex justify-center">
            <div
              className={`w-full max-w-sm rounded-[36px] border p-4 shadow-2xl relative overflow-hidden backdrop-blur-xl ${
                isLight
                  ? "bg-white border-slate-300 shadow-slate-300/60"
                  : "bg-[#11131a] border-white/20 shadow-black/90"
              }`}
            >
              {/* Phone Notch */}
              <div className="w-32 h-5 bg-black/60 rounded-full mx-auto mb-3 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-neutral-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
              </div>

              {/* Viewport Frame 9:16 */}
              <div className="relative aspect-[9/16] rounded-[24px] overflow-hidden bg-black border border-white/10 shadow-inner group">
                {/* Real Authentic Comic Art in Phone Frame */}
                <div
                  className={`absolute inset-0 transition-transform duration-700 ease-out ${
                    activeMode.id === "scroll"
                      ? "scale-105 animate-pulse"
                      : activeMode.id === "punch"
                      ? "scale-125"
                      : activeMode.id === "suspense"
                      ? "translate-y-2 scale-110"
                      : "scale-100"
                  }`}
                >
                  <img
                    src={activeMode.image}
                    alt={activeMode.name}
                    className="w-full h-full object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/40" />
                </div>

                {/* Live Overlays */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white text-xs font-bold drop-shadow z-10">
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-[10px] font-mono">
                    9:16 VERTICAL
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-blue-600/90 backdrop-blur-md text-[10px] font-mono flex items-center gap-1 shadow-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    {activeMode.name.split(" ")[0]}
                  </span>
                </div>

                {/* Subtitle simulation bar */}
                <div className="absolute bottom-6 inset-x-4 p-3 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 text-center space-y-1 z-10 shadow-2xl">
                  <p className="text-white text-xs font-black leading-snug">
                    "{activeMode.subtitle}"
                  </p>
                  <p className="text-blue-400 text-[10px] font-mono font-bold">
                    {activeMode.soundFx}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 text-center">
                <button
                  onClick={onGetStarted}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Render With This Camera Motion
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
