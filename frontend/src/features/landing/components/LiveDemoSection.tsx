import React from "react";
import { Scissors, Sparkles, Languages, Film } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import {
  SlicingBefore,
  SlicingAfter,
  BubblesBefore,
  BubblesAfter,
  TranslationBefore,
  TranslationAfter,
  CinematicRenderDemo,
} from "./demo";
import type { ThemeMode, DemoTabId } from "../types";

export interface LiveDemoSectionProps {
  themeMode?: ThemeMode;
  demoTab: DemoTabId;
  setDemoTab: (tab: DemoTabId) => void;
  onGetStarted: () => void;
}

export function LiveDemoSection({
  themeMode = "dark",
  demoTab,
  setDemoTab,
  onGetStarted,
}: LiveDemoSectionProps) {
  const isLight = themeMode === "light";

  const tabs: Array<{
    id: DemoTabId;
    label: string;
    icon: React.ReactNode;
    tip: string;
  }> = [
    {
      id: "slicing",
      label: "1. Panel Slicing",
      icon: <Scissors className="w-4 h-4" />,
      tip: "Automatic comic panel bounding box detection",
    },
    {
      id: "bubbles",
      label: "2. Speech Bubble Removal",
      icon: <Sparkles className="w-4 h-4" />,
      tip: "Clean speech text bubbles with AI inpainting",
    },
    {
      id: "translation",
      label: "3. Auto Translation",
      icon: <Languages className="w-4 h-4" />,
      tip: "Detect foreign dialogues & translate into English",
    },
    {
      id: "render",
      label: "4. Cinematic Render",
      icon: <Film className="w-4 h-4" />,
      tip: "Animated video with voices and camera motion",
    },
  ];

  return (
    <section
      id="demo-showcase"
      className="pt-28 pb-24 px-6 relative overflow-hidden scroll-mt-24 z-10"
    >
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span
            className={`text-xs font-mono font-bold uppercase tracking-widest ${
              isLight ? "text-blue-700" : "text-blue-400"
            }`}
          >
            Live Preview
          </span>
          <h2
            className={`text-3xl md:text-4xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            See your story take shape
          </h2>
          <p
            className={`max-w-xl mx-auto text-sm font-medium ${
              isLight ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            Explore how panel selection, dialogue cleanup, and translation can fit
            into one connected workflow.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {tabs.map((t) => (
            <Tooltip key={t.id} text={t.tip} placement="top">
              <button
                onClick={() => setDemoTab(t.id)}
                className={`h-11 px-5 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2.5 transition-all duration-200 cursor-pointer active:scale-95 ${
                  demoTab === t.id
                    ? "bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-md shadow-blue-500/25 -translate-y-0.5"
                    : isLight
                    ? "bg-white text-slate-800 border border-slate-300 hover:border-blue-500/40 hover:text-blue-600 hover:-translate-y-0.5 shadow-2xs"
                    : "bg-[#141414] text-white border border-[#2F2F2F] hover:bg-[#2A2A2A] hover:border-neutral-500 hover:-translate-y-0.5 shadow-sm"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            </Tooltip>
          ))}
        </div>

        {/* Visual Demo Showcase */}
        {demoTab === "render" ? (
          <div className="max-w-5xl mx-auto">
            <CinematicRenderDemo onGetStarted={onGetStarted} />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div
                className={`rounded-[28px] border overflow-hidden shadow-xl transition-all ${
                  isLight
                    ? "border-slate-200 bg-white"
                    : "border-[#2F2F2F] bg-[#141414]"
                }`}
              >
                <div className="px-4 py-2.5 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-neutral-300">
                    Before (Raw Comic Chapter)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <div className="h-[360px]">
                  {demoTab === "slicing" && <SlicingBefore />}
                  {demoTab === "bubbles" && <BubblesBefore />}
                  {demoTab === "translation" && <TranslationBefore />}
                </div>
              </div>
              <div
                className={`rounded-[28px] border overflow-hidden shadow-xl transition-all ${
                  isLight
                    ? "border-slate-200 bg-white"
                    : "border-[#2F2F2F] bg-[#141414]"
                }`}
              >
                <div className="px-4 py-2.5 border-b border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-blue-400">
                    After (AI Processed)
                  </span>
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                </div>
                <div className="h-[360px]">
                  {demoTab === "slicing" && <SlicingAfter />}
                  {demoTab === "bubbles" && <BubblesAfter />}
                  {demoTab === "translation" && <TranslationAfter />}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
