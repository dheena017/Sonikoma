import React from "react";
import {
  Sparkles,
  Scissors,
  Sliders,
  Volume2,
  Cpu,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";

import { WORKFLOW_LOGOS } from "@/shared/constants/workflowLogos";

interface PipelineStep {
  step: string;
  title: string;
  status: string;
  logo: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetPath: string;
  actionLabel: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: "01",
    title: "Scrape URL",
    status: "Ingestion Engine",
    logo: WORKFLOW_LOGOS.scrape,
    icon: Scissors,
    description:
      "Fetches webtoon chapters directly from URLs, MangaDex, Webtoons, or local CBZ/image archives into organized asset pools.",
    targetPath: "/scraper",
    actionLabel: "Import URL",
  },
  {
    step: "02",
    title: "Merge & Crop",
    status: "Canny Edge CV",
    logo: WORKFLOW_LOGOS.crop,
    icon: Scissors,
    description:
      "Runs Canny edge detection algorithms to detect comic gutters, isolate panel boundaries, and slice vertical strips into individual frames.",
    targetPath: "/image-editor",
    actionLabel: "Launch Slicer",
  },
  {
    step: "03",
    title: "AI Narrative",
    status: "Vision Inpaint",
    logo: WORKFLOW_LOGOS.narrative,
    icon: Sliders,
    description:
      "Detects speech bubble boundaries, removes dialogue via seamless neural inpainting, and transcribes spoken text for voice routing.",
    targetPath: "/creative-suite",
    actionLabel: "Story Script",
  },
  {
    step: "04",
    title: "Voice Audio",
    status: "Kokoro & ElevenLabs",
    logo: WORKFLOW_LOGOS.voice,
    icon: Volume2,
    description:
      "Synthesizes script lines using emotive voice models, auto-detects character tones, and binds multi-speaker dialogue tracks.",
    targetPath: "/characters",
    actionLabel: "Voice Casting",
  },
  {
    step: "05",
    title: "Video Render",
    status: "60 FPS WebGPU",
    logo: WORKFLOW_LOGOS.render,
    icon: Cpu,
    description:
      "Composites layered panels with camera zoom paths, particle effects, parallax anime motion, and synchronized SFX to produce MP4 reels.",
    targetPath: "/video-editor",
    actionLabel: "Video Timeline",
  },
];

export default function DashboardAIPipeline() {
  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-5 sm:p-6 shadow-md text-left transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
              <Sparkles className="h-4 w-4 text-[#3B82F6]" />
            </div>
            <h3 className="text-base font-bold text-[#E5E5E5] tracking-tight">
              AI Manga-to-Video Engine Pipeline
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-emerald-400 text-[10px] font-mono font-bold uppercase">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Models Ready
            </span>
          </div>
          <p className="text-xs text-[#9CA3AF] font-sans leading-relaxed max-w-2xl">
            Sonikoma automates the end-to-end transformation of vertical webtoons into cinematic narrated anime videos across 5 interconnected neural pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[#6B7280]">
            Autonomous Workflow
          </span>
        </div>
      </div>

      {/* 5 Pipeline Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {PIPELINE_STEPS.map((item) => {
          return (
            <div
              key={item.step}
              onClick={() => navigateToDashboardPath(item.targetPath)}
              className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#282828] hover:border-neutral-700 hover:bg-[#1C1C1C] hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-black text-[#6B7280] group-hover:text-[#3B82F6] transition-colors shrink-0">
                      {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#1E1E1E] shrink-0 flex items-center justify-center shadow-xs group-hover:border-[#3B82F6]/50 transition-colors">
                      <img
                        src={item.logo}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <h4 className="text-sm font-bold text-[#E5E5E5] group-hover:text-white transition-colors truncate">
                      {item.title}
                    </h4>
                  </div>

                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#2F2F2F] bg-[#1E1E1E] text-[#9CA3AF] shrink-0">
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-[#9CA3AF] leading-relaxed font-sans mb-3">
                  {item.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#232323] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#6B7280] group-hover:text-[#9CA3AF] transition-colors">
                  Pipeline Step {item.step}
                </span>
                <span className="font-bold text-[#3B82F6] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  {item.actionLabel}
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
