import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  X,
  Play,
  Layers,
  Globe,
  Scissors,
  Mic,
  Film,
} from "lucide-react";
import { navigateToDashboardPath } from "../utils/dashboardHelpers";
import type { OnboardingTask } from "../hooks/useDashboardPage";

interface DashboardOnboardingGuideProps {
  tasks: OnboardingTask[];
  onNewSeries: () => void;
}

interface StepDetail {
  id: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  path: string;
  ctaText: string;
}

const STEP_DETAILS: Record<number, StepDetail> = {
  1: {
    id: 1,
    title: "1. Scrape or Import Manga Strips",
    desc: "Paste a Webtoon URL, MangaDex link, or upload local images to extract panels.",
    icon: Globe,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    path: "/scraper",
    ctaText: "Open Scraper",
  },
  2: {
    id: 2,
    title: "2. Detect Gutters & Inpaint Bubbles",
    desc: "Let computer vision segment frames and erase speech bubbles automatically.",
    icon: Scissors,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    path: "/image-editor",
    ctaText: "Open Slicer",
  },
  3: {
    id: 3,
    title: "3. Cast Character Voice Actors",
    desc: "Assign distinct anime voices to dialogues and synthesize emotive audio.",
    icon: Mic,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    path: "/characters",
    ctaText: "Voice Studio",
  },
  4: {
    id: 4,
    title: "4. Composite 2.5D Motion Reel",
    desc: "Keyframe camera zooms, add layered parallax anime motion, and export MP4 video.",
    icon: Film,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    path: "/video-editor",
    ctaText: "Video Editor",
  },
};

export default function DashboardOnboardingGuide({
  tasks,
  onNewSeries,
}: DashboardOnboardingGuideProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("sonikoma_dismiss_onboarding") === "true";
  });

  if (isDismissed) return null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = Math.round((completedCount / (tasks.length || 4)) * 100);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("sonikoma_dismiss_onboarding", "true");
  };

  const handleStepClick = (stepId: number) => {
    const detail = STEP_DETAILS[stepId];
    if (detail) {
      if (stepId === 1) {
        onNewSeries();
      } else {
        navigateToDashboardPath(detail.path);
      }
    }
  };

  return (
    <div className="rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-5 sm:p-6 shadow-md transition-all text-left">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#141414] text-[#3B82F6] border border-[#2F2F2F]">
            <Sparkles className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black text-[#E5E5E5] tracking-tight">
                Getting Started: Produce Your First Anime Video
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-[#141414] border border-[#2F2F2F] text-[#9CA3AF] font-mono text-[10px] font-bold">
                {completedCount} of {tasks.length || 4} Completed
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] font-sans mt-0.5">
              Follow these 4 simple steps to turn static manga into a cinematic animated reel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#252525] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
            title={isCollapsed ? "Expand Guide" : "Collapse Guide"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#252525] border border-[#2F2F2F] text-[#9CA3AF] hover:text-white transition-colors cursor-pointer"
            title="Dismiss Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 relative z-10">
        <div className="w-full bg-[#121212] rounded-full h-1.5 overflow-hidden border border-[#2F2F2F]">
          <div
            className="bg-[#3B82F6] h-full rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, progressPct)}%` }}
          />
        </div>
      </div>

      {/* 4 Interactive Step Cards */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10">
          {tasks.map((task) => {
            const detail = STEP_DETAILS[task.id] || {
              id: task.id,
              title: task.text,
              desc: "Step in the animation production pipeline.",
              icon: Sparkles,
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-400",
              path: "/scraper",
              ctaText: "Launch",
            };
            const Icon = detail.icon;

            return (
              <div
                key={task.id}
                onClick={() => handleStepClick(task.id)}
                className={`p-3.5 rounded-xl bg-[#141414] border ${
                  task.completed
                    ? "border-emerald-500/30 bg-emerald-950/10"
                    : "border-[#282828] hover:border-blue-500/40 hover:bg-[#1A1A1A]"
                } transition-all cursor-pointer group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`p-1.5 rounded-lg ${detail.iconBg} ${detail.iconColor} border border-white/5 shrink-0`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {task.completed ? (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#6B7280] group-hover:text-blue-400 transition-colors">
                        Pending
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs font-bold mb-1 ${
                      task.completed
                        ? "text-neutral-400 line-through"
                        : "text-[#E5E5E5] group-hover:text-white"
                    }`}
                  >
                    {detail.title}
                  </h4>

                  <p className="text-[11px] text-[#9CA3AF] line-clamp-2 leading-relaxed">
                    {detail.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#222222] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[#6B7280]">Step 0{task.id}</span>
                  <span className="text-[#3B82F6] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    {detail.ctaText} <ArrowRight className="w-3 h-3" />
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
