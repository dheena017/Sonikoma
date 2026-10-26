import React from "react";
import type { ThemeMode } from "../types";

export interface HowItWorksSectionProps {
  themeMode?: ThemeMode;
}

const STEPS = [
  {
    step: "Step 01",
    title: "Scrape URL",
    description:
      "Paste any chapter link from MangaDex or Webtoon, or upload comic image files.",
    logo: "/workflow-logos/simple_scrape_logo.jpg",
    accent: "text-blue-400 border-[#2F2F2F] hover:border-blue-500/60",
  },
  {
    step: "Step 02",
    title: "Merge & Crop",
    description:
      "Canny edge algorithms detect gutters and slice vertical strips into clean panels.",
    logo: "/workflow-logos/simple_crop_logo.jpg",
    accent: "text-blue-400 border-[#2F2F2F] hover:border-blue-500/60",
  },
  {
    step: "Step 03",
    title: "AI Narrative",
    description:
      "Erases speech bubbles via neural inpainting and composes narrative scripts.",
    logo: "/workflow-logos/simple_narrative_logo.jpg",
    accent: "text-blue-400 border-[#2F2F2F] hover:border-blue-500/60",
  },
  {
    step: "Step 04",
    title: "Voice Audio",
    description:
      "Synthesizes neural voiceovers and dialogue timing synced to frame transitions.",
    logo: "/workflow-logos/simple_voice_logo.jpg",
    accent: "text-blue-400 border-[#2F2F2F] hover:border-blue-500/60",
  },
  {
    step: "Step 05",
    title: "Video Render",
    description:
      "Renders 2.5D camera pan, particle SFX, and exports vertical 4K 60fps MP4 video.",
    logo: "/workflow-logos/simple_video_render_logo.jpg",
    accent: "text-blue-400 border-[#2F2F2F] hover:border-blue-500/60",
  },
];

export function HowItWorksSection({ themeMode = "dark" }: HowItWorksSectionProps) {
  const isLight = themeMode === "light";

  return (
    <section
      id="how-it-works"
      className={`py-24 px-6 scroll-mt-24 transition-colors relative z-10 ${
        isLight
          ? "bg-slate-100/70 border-y border-slate-200"
          : "bg-[#0d0e12] border-y border-[#2F2F2F]"
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center space-y-3">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-widest ${
              isLight ? "text-blue-700" : "text-blue-400"
            }`}
          >
            Autonomous 5-Step Pipeline
          </span>
          <h2
            className={`text-3xl md:text-4xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            From raw comic chapter to finished 4K video
          </h2>
          <p
            className={`max-w-xl mx-auto text-sm leading-relaxed font-medium ${
              isLight ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            Start with a chapter link or image archive, then let the neural pipeline
            transform each panel into cinematic video reels.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className={`p-6 rounded-[24px] border transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between ${
                isLight
                  ? "bg-white border-slate-200 shadow-sm hover:shadow-lg"
                  : "bg-[#181818] border-[#2F2F2F] hover:shadow-xl"
              } ${s.accent}`}
            >
              <div>
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 mb-4 shadow-md bg-neutral-900">
                  <img
                    src={s.logo}
                    alt={s.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-1">
                  {s.step}
                </span>
                <h3
                  className={`text-base font-bold mb-1.5 ${
                    isLight ? "text-slate-950" : "text-white"
                  }`}
                >
                  {s.title}
                </h3>
                <p
                  className={`text-xs leading-relaxed font-normal ${
                    isLight ? "text-slate-700" : "text-neutral-400"
                  }`}
                >
                  {s.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
