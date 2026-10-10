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

interface PipelineStep {
  step: string;
  title: string;
  status: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  targetPath: string;
  actionLabel: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: "01",
    title: "Smart Panel Slicer",
    status: "Canny Edge CV",
    icon: Scissors,
    description:
      "Runs Canny edge detection algorithms to detect comic gutters, isolate panel boundaries, and slice vertical strips into individual frames.",
    targetPath: "/image-editor",
    actionLabel: "Launch Slicer",
  },
  {
    step: "02",
    title: "Bubble OCR & Clean",
    status: "Vision Inpaint",
    icon: Sliders,
    description:
      "Detects speech bubble boundaries, removes dialogue via seamless neural inpainting, and transcribes spoken text for voice routing.",
    targetPath: "/image-editor",
    actionLabel: "Speech Clean",
  },
  {
    step: "03",
    title: "Dialogue Voice Synthesis",
    status: "Kokoro & ElevenLabs",
    icon: Volume2,
    description:
      "Synthesizes script lines using emotive voice models, auto-detects character tones, and binds multi-speaker dialogue tracks.",
    targetPath: "/characters",
    actionLabel: "Voice Casting",
  },
  {
    step: "04",
    title: "2.5D Video Compositor",
    status: "60 FPS WebGPU",
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
            Sonikoma automates the end-to-end transformation of vertical webtoons into cinematic narrated anime videos across 4 interconnected neural pipelines.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-mono text-[#6B7280]">
            Autonomous Workflow
          </span>
        </div>
      </div>

      {/* 4 Pipeline Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {PIPELINE_STEPS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              onClick={() => navigateToDashboardPath(item.targetPath)}
              className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#282828] hover:border-neutral-700 hover:bg-[#1C1C1C] hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-black text-[#6B7280] group-hover:text-[#3B82F6] transition-colors">
                      {item.step}
                    </span>
                    <div className="p-2 rounded-xl bg-[#1E1E1E] text-[#3B82F6] border border-[#2F2F2F] shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h4 className="text-sm font-bold text-[#E5E5E5] group-hover:text-white transition-colors">
                      {item.title}
                    </h4>
                  </div>

                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border border-[#2F2F2F] bg-[#1E1E1E] text-[#9CA3AF] shrink-0">
                    {item.status}
                  </span>
                </div>

                <p className="text-xs text-[#9CA3AF] leading-relaxed font-sans mb-3 pl-8">
                  {item.description}
                </p>
              </div>

              <div className="pt-2.5 border-t border-[#232323] flex items-center justify-between text-[11px] font-mono pl-8">
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
