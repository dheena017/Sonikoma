import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Globe,
  Layout,
  Scissors,
  Film,
  Sparkles,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";
import type { OnboardingTask } from "../types";

interface DashboardOnboardingGuideProps {
  tasks: OnboardingTask[];
  onNewSeries: () => void;
}

interface PipelineStep {
  step: number;
  label: string;
  name: string;
  action: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    step: 1,
    label: "01",
    name: "Scrape URL",
    action: "Enter URL or upload chapter",
    desc: "Paste Webtoon link or upload files to extract panels",
    icon: Globe,
    path: "/scraper",
  },
  {
    step: 2,
    label: "02",
    name: "Workspace",
    action: "Review storyboard",
    desc: "Inspect parsed frames, speech text & scene layout",
    icon: Layout,
    path: "/editor",
  },
  {
    step: 3,
    label: "03",
    name: "Edit Image",
    action: "Crop & clean panels",
    desc: "Fine-tune gutters, redraw art & erase speech bubbles",
    icon: Scissors,
    path: "/image-editor",
  },
  {
    step: 4,
    label: "04",
    name: "Video Editor",
    action: "Animate & export MP4",
    desc: "Set 2.5D camera motion, voice acting & render reel",
    icon: Film,
    path: "/video-editor",
  },
];

export default function DashboardOnboardingGuide({
  onNewSeries,
}: DashboardOnboardingGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("sonikoma_dismiss_onboarding") === "true";
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("sonikoma_dismiss_onboarding", "true");
  };

  const handleStepClick = (step: number, path: string) => {
    if (step === 1) {
      onNewSeries();
    } else {
      navigateToDashboardPath(path);
    }
  };

  return (
    <div className="rounded-2xl bg-[#1E1E1E] border border-[#2F2F2F] p-4 sm:p-5 text-left transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 text-[#3B82F6] border border-[#3B82F6]/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#E5E5E5] font-sans">
                Production Pipeline
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF]">
                4-Step Flow
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Follow the workflow from chapter URL scraping to final video animation.
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] transition-colors cursor-pointer"
          >
            <span>{isCollapsed ? "Show Workflow" : "Hide"}</span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
            title="Dismiss pipeline guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Connected Horizontal Workflow */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1">
          {PIPELINE_STEPS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                onClick={() => handleStepClick(item.step, item.path)}
                className="group relative rounded-xl p-3.5 bg-[#141414] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#1A1A1A] transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Step Badge & Icon */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:text-[#3B82F6] transition-colors">
                      STEP {item.label}
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center text-[#9CA3AF] group-hover:text-[#3B82F6] transition-colors">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Title & Action */}
                  <h3 className="text-xs font-bold text-[#E5E5E5] group-hover:text-white font-sans mb-1">
                    {item.name}
                  </h3>
                  <div className="text-[11px] font-mono text-[#3B82F6] font-medium mb-1.5">
                    {item.action}
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] font-sans leading-relaxed line-clamp-2">
                    {item.desc}
                  </p>
                </div>

                {/* Footer Arrow CTA */}
                <div className="mt-3 pt-2.5 border-t border-[#222222] flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#6B7280]">Launch</span>
                  <span className="text-[#3B82F6] font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
