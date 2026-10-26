import React from "react";
import { Plus } from "lucide-react";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface DashboardHeaderProps {
  themeMode?: string;
  onNewSeries: () => void;
}

export default function DashboardHeader({
  onNewSeries,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#2F2F2F]">
      <div className="space-y-2 max-w-2xl text-left">
        {/* Title & Subtitle */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#E5E5E5] leading-tight font-sans">
          Welcome to{" "}
          <span className="text-[#3B82F6]">
            Sonikoma Studio
          </span>
        </h1>
        <p className="text-[#9CA3AF] text-xs sm:text-sm font-sans leading-relaxed max-w-xl">
          Convert webtoons and manga into cinematic narrated anime videos with
          OCR speech bubbles and 2.5D camera motions.
        </p>
      </div>

      {/* Right CTA Action */}
      <div className="flex items-center gap-3 shrink-0">
        <Tooltip
          text="Scrape webtoon URL or start a new storyboard series"
          placement="bottom"
        >
          <button
            type="button"
            onClick={onNewSeries}
            aria-label="Start new chapter"
            className="flex items-center gap-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-md border border-[#3B82F6]/30 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Chapter</span>
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
