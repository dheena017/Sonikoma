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
} from "@/features/app_auth/components/constants";
import { LandingAnimeScene } from "@/features/app_landing/components/LandingAnimeScene";
import { SonikomaLogo } from "@/shared/ui/branding";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface AuthShowcaseProps {
  activeTheme: ThemeKey;
  iconType: "login" | "register" | "forgot";
}

const SIMPLE_SLIDES = [
  {
    icon: Sparkles,
    badge: "Step 1",
    title: "Auto-Crop Comic Panels",
    description: "Automatically slice long webtoon strips into independent, perfectly cropped storyboard panels in seconds.",
  },
  {
    icon: Film,
    badge: "Step 2",
    title: "Smooth Camera Motion",
    description: "Bring static panels to life with automatic camera zooms, pan effects, and smooth vertical scrolling.",
  },
  {
    icon: Volume2,
    badge: "Step 3",
    title: "Character Voice Narration",
    description: "Generate realistic character dialogue voiceovers and sync background music and sound effects automatically.",
  },
  {
    icon: Cpu,
    badge: "Step 4",
    title: "Export Ready Videos",
    description: "Download high-definition vertical MP4 videos ready to post on TikTok, YouTube Shorts, and Instagram Reels.",
  },
];

export default function AuthShowcase({}: AuthShowcaseProps) {
  const [currentSlide, setCurrentSlide] = React.useState(0);

  // Auto-play product carousel
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SIMPLE_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden lg:flex w-1/2 h-screen flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-[#0A0A0A] text-left select-none border-r border-[#2F2F2F] z-10">
      {/* Background Animated Anime Hero Scene (Shown ONLY in Left Showcase) */}
      <LandingAnimeScene variant="auth" themeMode="dark" />

      {/* Top Header Branding Card */}
      <div className="relative z-10 flex items-center justify-between p-3.5 px-5 rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#2F2F2F] shadow-xl w-full">
        <SonikomaLogo size="sm" />
      </div>

      {/* Carousel Slide Area with High-Contrast Background Card */}
      <div className="relative z-10 my-auto w-full max-w-xl min-h-[460px] flex flex-col justify-center">
        {SIMPLE_SLIDES.map((slide, idx) => {
          const isActive = idx === currentSlide;

          return (
            <div
              key={idx}
              className={`absolute inset-0 flex flex-col justify-between transition-all duration-500 ease-out transform ${
                isActive
                  ? "opacity-100 scale-100 translate-y-0 visible"
                  : "opacity-0 scale-95 translate-y-4 invisible pointer-events-none"
              }`}
            >
              {/* Slide Title & Description */}
              <div className="space-y-3 p-5 rounded-2xl bg-[#0D0E12]/80 backdrop-blur-xl border border-[#2F2F2F]/80 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                    {slide.badge}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400 font-bold">
                    0{idx + 1} / 0{SIMPLE_SLIDES.length}
                  </span>
                </div>

                <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight leading-tight">
                  {slide.title}
                </h1>
                <p className="text-neutral-300 text-sm leading-relaxed font-normal max-w-lg">
                  {slide.description}
                </p>
              </div>

              {/* Visual Demo Card */}
              <div className="my-4 w-full rounded-2xl border border-[#2F2F2F] bg-[#141414]/95 backdrop-blur-2xl p-4 shadow-2xl relative overflow-hidden">
                {idx === 0 && (
                  /* Slide 0: AI Panel Slicing */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        Automatic Comic Slicing
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="bg-[#181818] border border-blue-500/30 rounded-xl p-2.5 text-center space-y-1">
                        <div className="h-16 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
                          ⚡️
                        </div>
                        <span className="text-xs font-bold text-white block truncate">
                          Panel 1
                        </span>
                        <span className="text-[10px] text-blue-400 block font-medium">
                          Auto-Cropped
                        </span>
                      </div>
                      <div className="bg-[#181818] border border-blue-500/30 rounded-xl p-2.5 text-center space-y-1">
                        <div className="h-16 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-xl text-blue-400">
                          ⚔️
                        </div>
                        <span className="text-xs font-bold text-white block truncate">
                          Panel 2
                        </span>
                        <span className="text-[10px] text-blue-400 block font-medium">
                          Auto-Cropped
                        </span>
                      </div>
                      <div className="bg-[#181818] border border-[#2F2F2F] rounded-xl p-2.5 text-center space-y-1">
                        <div className="h-16 rounded-lg bg-indigo-500/10 border border-[#2F2F2F] flex items-center justify-center text-xl text-indigo-400">
                          💥
                        </div>
                        <span className="text-xs font-bold text-white block truncate">
                          Panel 3
                        </span>
                        <span className="text-[10px] text-indigo-400 block font-medium">
                          Auto-Cropped
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 1 && (
                  /* Slide 1: Camera Motions */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Film className="w-4 h-4 text-blue-400" />
                        Dynamic Camera Motion
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        60 FPS Video
                      </span>
                    </div>
                    <div className="h-24 rounded-xl bg-[#181818] border border-[#2F2F2F] p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">
                            Smooth Camera Pan & Zoom
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Automatic motion animation
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-[#0E0E0E] text-blue-400 text-[10px] font-bold border border-[#2F2F2F]">
                        1080p / 4K
                      </span>
                    </div>
                  </div>
                )}

                {idx === 2 && (
                  /* Slide 2: Voice Narration */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Volume2 className="w-4 h-4 text-blue-400" />
                        Character Voices & Audio
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        Natural TTS
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-[#181818] border border-[#2F2F2F] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            Main Character Voice
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Dramatic • English
                          </p>
                        </div>
                        <div className="flex items-end gap-1 h-5">
                          <span className="w-1 bg-blue-400 h-3 rounded-full animate-pulse" />
                          <span className="w-1 bg-indigo-400 h-5 rounded-full animate-pulse" />
                          <span className="w-1 bg-blue-400 h-2 rounded-full animate-pulse" />
                        </div>
                      </div>
                      <div className="bg-[#181818] border border-[#2F2F2F] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">
                            Background Soundtracks
                          </p>
                          <p className="text-[10px] text-neutral-400">
                            Action & Mystery
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Auto-Synced
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {idx === 3 && (
                  /* Slide 3: Video Export */
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 border-b border-[#2F2F2F] pb-2">
                      <span className="flex items-center gap-1.5 text-blue-400 font-bold">
                        <Cpu className="w-4 h-4 text-blue-400" />
                        Ready to Post
                      </span>
                      <span className="text-[10px] text-blue-400 font-bold px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        Vertical MP4
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-300 font-bold">
                          Video Generation
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
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818]/90 border border-[#2F2F2F] px-3 py-1.5 rounded-lg shadow-sm">
                  ⚡ Fast Generation
                </span>
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818]/90 border border-[#2F2F2F] px-3 py-1.5 rounded-lg shadow-sm">
                  🎬 1080p & 4K Video
                </span>
                <span className="text-xs font-semibold text-neutral-300 bg-[#181818]/90 border border-[#2F2F2F] px-3 py-1.5 rounded-lg shadow-sm">
                  🎯 Auto Translation
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Navigation Bar */}
      <div className="relative z-10 flex items-center justify-between p-3.5 px-5 rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#2F2F2F] shadow-xl mt-4">
        <div className="flex items-center gap-4">
          {/* Step indicator dots */}
          <div className="flex items-center gap-2">
            {SIMPLE_SLIDES.map((_, idx) => (
              <Tooltip key={idx} text={`View Step ${idx + 1}`} placement="top">
                <button
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    idx === currentSlide
                      ? "w-8 bg-blue-500 shadow-sm shadow-blue-500/50"
                      : "w-2 bg-neutral-700 hover:bg-neutral-500"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              </Tooltip>
            ))}
          </div>

          {/* Prev / Next Controls */}
          <div className="flex items-center gap-1.5 pl-3 border-l border-[#2F2F2F]">
            <Tooltip text="Previous feature" placement="top">
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) =>
                    prev === 0 ? SIMPLE_SLIDES.length - 1 : prev - 1
                  )
                }
                className="w-7 h-7 rounded-lg bg-[#181818] hover:bg-[#222] text-neutral-300 hover:text-white transition-all cursor-pointer text-xs font-bold border border-[#2F2F2F] hover:border-neutral-500 flex items-center justify-center active:scale-95 shadow-2xs"
                aria-label="Previous slide"
              >
                &larr;
              </button>
            </Tooltip>
            <Tooltip text="Next feature" placement="top">
              <button
                type="button"
                onClick={() =>
                  setCurrentSlide((prev) => (prev + 1) % SIMPLE_SLIDES.length)
                }
                className="w-7 h-7 rounded-lg bg-[#181818] hover:bg-[#222] text-neutral-300 hover:text-white transition-all cursor-pointer text-xs font-bold border border-[#2F2F2F] hover:border-neutral-500 flex items-center justify-center active:scale-95 shadow-2xs"
                aria-label="Next slide"
              >
                &rarr;
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Copyright badge */}
        <p className="text-xs text-neutral-400 font-medium select-none">
          © {new Date().getFullYear()} Sonikoma Studio
        </p>
      </div>
    </div>
  );
}
