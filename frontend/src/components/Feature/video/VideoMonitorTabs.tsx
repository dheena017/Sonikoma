import React from "react";
import { GeneratedPanel } from "@/types";

interface VideoMonitorTabsProps {
  activePreviewTab: "video" | "timeline";
  setActivePreviewTab: (tab: "video" | "timeline") => void;
  videoUrl: string | null;
  panels: GeneratedPanel[];
  aspectRatio: "auto" | "9:16" | "16:9";
}

export function VideoMonitorTabs({
  activePreviewTab,
  setActivePreviewTab,
  videoUrl,
  panels,
  aspectRatio,
}: VideoMonitorTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActivePreviewTab("video")}
          disabled={!videoUrl}
          className={`px-3 py-1 text-xs rounded-lg transition-all ${
            !videoUrl
              ? "opacity-40 cursor-not-allowed"
              : activePreviewTab === "video"
              ? "bg-purple-600 text-white font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          Output MP4 Player
        </button>
        <button
          onClick={() => setActivePreviewTab("timeline")}
          disabled={panels.length === 0}
          className={`px-3 py-1 text-xs rounded-lg transition-all ${
            panels.length === 0
              ? "opacity-40 cursor-not-allowed"
              : activePreviewTab === "timeline"
              ? "bg-purple-600 text-white font-bold"
              : "bg-neutral-900 text-neutral-300 hover:text-white"
          }`}
        >
          Timeline Preview
        </button>
      </div>

      <span className="self-start sm:self-auto text-[10px] font-mono bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400">
        {aspectRatio === "9:16"
          ? "Portrait (1080x1920)"
          : aspectRatio === "16:9"
          ? "Landscape (1920x1080)"
          : "Auto-Detect"}
      </span>
    </div>
  );
}
