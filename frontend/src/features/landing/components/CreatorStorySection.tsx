import React from "react";
import { Volume2, Scissors, Film, ArrowRight, Play } from "lucide-react";
import type { ThemeMode } from "../types";

export interface CreatorStorySectionProps {
  themeMode?: ThemeMode;
}

export function CreatorStorySection({
  themeMode = "dark",
}: CreatorStorySectionProps) {
  const isLight = themeMode === "light";

  return (
    <section
      className={`py-20 sm:py-28 px-6 relative z-10 ${
        isLight ? "bg-white" : "bg-[#0a0b0e]"
      }`}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Visual Poster Frame with Play Overlay */}
        <div
          className={`group relative min-h-[360px] sm:min-h-[460px] rounded-[32px] overflow-hidden border shadow-2xl transition-all duration-300 ${
            isLight
              ? "border-slate-200 shadow-slate-300/40"
              : "border-white/10 shadow-black/40 hover:border-white/20"
          }`}
        >
          <img
            src="/landing-anime-hero.png"
            alt="A creator brings a comic scene to life in a digital studio"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-[72%_35%] transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080a12] via-[#080a12]/20 to-transparent" />

          {/* Top Floating Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-xs font-semibold text-white">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>ANIMATED PREVIEW</span>
            </span>
          </div>

          {/* Centered Play Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-2xl backdrop-blur-md border border-white/20 transition-transform duration-300 group-hover:scale-110">
              <Play className="w-7 h-7 fill-white ml-1" />
            </div>
          </div>

          {/* Bottom Metadata Bar */}
          <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7 z-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
                  Your next story starts here
                </span>
                <p className="mt-1 text-xl sm:text-2xl font-black text-white">
                  From page to playback.
                </p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md">
                <Volume2 className="h-4 w-4 text-blue-400" />
                <span>Panels with a voice</span>
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Copy & Feature Highlights */}
        <div className="space-y-7">
          <div className="space-y-4">
            <span
              className={`text-xs font-bold uppercase tracking-[0.18em] ${
                isLight ? "text-blue-700" : "text-blue-400"
              }`}
            >
              More than a video maker
            </span>
            <h2
              className={`text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight ${
                isLight ? "text-slate-950" : "text-white"
              }`}
            >
              Give every panel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-500">
                a little more life.
              </span>
            </h2>
            <p
              className={`text-base leading-relaxed max-w-xl ${
                isLight ? "text-slate-600" : "text-neutral-400"
              }`}
            >
              Shape the rhythm of your story. Refine panels, bring dialogue
              to life with character voices, and prepare a vertical cut
              that feels made to be watched.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                icon: <Scissors className="h-5 w-5" />,
                title: "A cleaner view of every scene",
                description:
                  "Separate long comic pages into focused, easy-to-follow panels.",
              },
              {
                icon: <Volume2 className="h-5 w-5" />,
                title: "Dialogue with its own voice",
                description:
                  "Build a distinct listening experience with character voices and narration.",
              },
              {
                icon: <Film className="h-5 w-5" />,
                title: "A format made for the feed",
                description:
                  "Bring your sequence together as a vertical video for short-form platforms.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-4 group">
                <span
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 group-hover:scale-105 ${
                    isLight
                      ? "border-blue-100 bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                      : "border-blue-400/20 bg-blue-400/10 text-blue-300 group-hover:bg-blue-400/20"
                  }`}
                >
                  {feature.icon}
                </span>
                <div>
                  <h3
                    className={`font-bold transition-colors ${
                      isLight ? "text-slate-900 group-hover:text-blue-600" : "text-white group-hover:text-blue-400"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`mt-1 text-sm leading-relaxed ${
                      isLight ? "text-slate-600" : "text-neutral-400"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("demo-showcase")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl border bg-[#141414] border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-blue-500/50 text-white text-sm font-bold transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:shadow-blue-500/20 active:scale-[0.98] group"
          >
            <span>Explore the workflow</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

