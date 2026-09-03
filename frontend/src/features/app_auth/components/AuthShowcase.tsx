import React from "react";
import {
  Sparkles,
  Film,
  Volume2,
  Cpu,
  Play,
} from "lucide-react";
import {
  ThemeKey,
  SHOWCASE_SLIDES,
} from "@/features/app_auth/components/constants";

interface AuthShowcaseProps {
  activeTheme: ThemeKey;
  iconType: "login" | "register" | "forgot";
}

export default function AuthShowcase({}: AuthShowcaseProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  // Auto-play product carousel
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex w-1/2 h-screen flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-[#0A0A0A] text-left select-none border-r border-[#2F2F2F]">
      {/* Top Header Branding */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 overflow-hidden shadow-sm">
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="w-7 h-7 object-contain"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white uppercase">
              Sonikoma
            </span>
            <span className="text-[10px] font-bold tracking-wider text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
              Studio
            </span>
          </div>
        </div>

        {/* Live indicator badge */}
        <div className="flex items-center gap-2 bg-[#181818] border border-[#2F2F2F] rounded-full px-3 py-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold tracking-wider text-neutral-300 uppercase">
            Live Studio
          </span>
        </div>
      </div>

      {/* Carousel Slide Area */}
      <div className="relative z-10 my-auto w-full max-w-xl min-h-[460px] flex flex-col justify-center">
        {SHOWCASE_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;

          return (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col justify-between transition-all duration-700 ease-out transform ${
                isActive
                  ? "opacity-100 scale-100 translate-y-0"
                  : "opacity-0 scale-95 translate-y-8 pointer-events-none"
              }`}
            >
              {/* Slide Title & Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {slide.badge}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-500 font-bold">
                    0{idx + 1} / 0{SHOWCASE_SLIDES.length}
                  </span>
                </div>

                <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-neutral-400 text-sm leading-relaxed font-normal max-w-lg">
                  {slide.description}
                </p>
              </div>

              {/* SLIDE VISUAL DEMO CARD (STUDIO THEME) */}
              <div className="my-5 w-full rounded-2xl border border-[#2F2F2F] bg-[#141414] p-4 shadow-xl relative overflow-hidden">
                {idx === 0 && (
                  /* Slide 0: AI Panel Segmentation */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        AI Strip Segmentation
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        99.8% Precision
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-[#181818] border border-blue-500/30 rounded-xl p-2.5 text-center space-y-1 shadow-sm">
                        <div className="h-16 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
                          ⚡️
                        </div>
                        <span className="text-[11px] font-bold text-white block truncate">
                          Awakening
                        </span>
                        <span className="text-[9px] font-mono text-blue-400 block font-bold">
                          Panel 1 • Sliced
                        </span>
                      </div>
                      <div className="bg-[#181818] border border-cyan-500/30 rounded-xl p-2.5 text-center space-y-1 shadow-sm">
                        <div className="h-16 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xl text-cyan-400">
                          ⚔️
                        </div>
                        <span className="text-[11px] font-bold text-white block truncate">
                          Shadow Clash
                        </span>
                        <span className="text-[9px] font-mono text-cyan-400 block font-bold">
                          Panel 2 • Sliced
                        </span>
                      </div>
                      <div className="bg-[#181818] border border-indigo-500/30 rounded-xl p-2.5 text-center space-y-1 shadow-sm">
                        <div className="h-16 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xl text-indigo-400">
                          💥
                        </div>
                        <span className="text-[11px] font-bold text-white block truncate">
                          Burst Attack
                        </span>
                        <span className="text-[9px] font-mono text-indigo-400 block font-bold">
                          Panel 3 • Sliced
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 1 && (
                  /* Slide 1: Cinematic Camera Dynamics */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Film className="w-4 h-4 text-blue-400" />
                        Cinematic Pan & Dynamic Zoom
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        60 FPS Motion
                      </span>
                    </div>
                    <div className="h-24 rounded-xl bg-[#181818] border border-[#2F2F2F] p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Ken-Burns Action Tracking
                          </p>
                          <p className="text-[10px] font-mono text-neutral-400">
                            Smooth 3D Parallax • Auto Shake
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#0E0E0E] text-blue-400 font-mono text-[10px] font-bold border border-[#2F2F2F]">
                        4K Ultra HD
                      </span>
                    </div>
                  </div>
                )}

                {idx === 2 && (
                  /* Slide 2: Multi-Character Voice Narration */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Volume2 className="w-4 h-4 text-blue-400" />
                        Multi-Character Neural Voice Dubbing
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        Studio Audio 48kHz
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-[#181818] border border-[#2F2F2F] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            Jin-Woo (Protagonist)
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Dramatic Voice • English
                          </p>
                        </div>
                        <div className="flex items-end gap-1 h-5">
                          <span className="w-1 bg-blue-400 h-3 rounded-full animate-pulse" />
                          <span className="w-1 bg-indigo-400 h-5 rounded-full animate-pulse" />
                          <span className="w-1 bg-cyan-400 h-2 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-[#181818] border border-[#2F2F2F] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            Epic Battle SFX
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Orchestral Background
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Auto Ducking
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 3 && (
                  /* Slide 3: Instant Video Render */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-mono text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        GPU Video Rendering Engine
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        MP4 / 9:16 Shorts
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-300 font-bold">
                          Rendering TikTok Video...
                        </span>
                        <span className="text-blue-400 font-bold">
                          100% Ready
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#0E0E0E] rounded-full overflow-hidden border border-[#2F2F2F]">
                        <div className="h-full bg-blue-600 w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feature Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818] border border-[#2F2F2F] px-3 py-1.5 rounded-lg">
                  ⚡ Fast AI Generation
                </span>
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818] border border-[#2F2F2F] px-3 py-1.5 rounded-lg">
                  🎬 1080p & 4K Output
                </span>
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818] border border-[#2F2F2F] px-3 py-1.5 rounded-lg">
                  🎯 Auto Translation & Dubbing
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Dots & Slide Switcher */}
      <div className="relative z-10 flex items-center justify-between border-t border-[#2F2F2F] pt-5 mt-4">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            {SHOWCASE_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide
                    ? "w-8 bg-blue-500"
                    : "w-2 bg-neutral-700 hover:bg-neutral-500"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) =>
                  prev === 0 ? SHOWCASE_SLIDES.length - 1 : prev - 1
                )
              }
              className="p-1 rounded-lg bg-[#181818] hover:bg-[#222] text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold px-2.5 border border-[#2F2F2F]"
              title="Previous slide"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length)
              }
              className="p-1 rounded-lg bg-[#181818] hover:bg-[#222] text-neutral-400 hover:text-white transition-colors cursor-pointer text-xs font-mono font-bold px-2.5 border border-[#2F2F2F]"
              title="Next slide"
            >
              &rarr;
            </button>
          </div>
        </div>

        <p className="text-xs text-neutral-500 font-medium font-mono">
          © {new Date().getFullYear()} Sonikoma Studio
        </p>
      </div>
    </div>
  );
}
