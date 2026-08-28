import React from "react";
import {
  BookOpen,
  Layout,
  Scissors,
  Music,
  Settings,
  TrendingUp,
} from "lucide-react";

interface CreatorGuideSectionProps {
  activeGuideTab: string;
  setActiveGuideTab: (value: string) => void;
}

const CreatorGuideSection: React.FC<CreatorGuideSectionProps> = ({
  activeGuideTab,
  setActiveGuideTab,
}) => {
  return (
    <div className="w-full rounded-[28px] border border-[#2F2F2F] bg-gradient-to-b from-[#181818] via-[#141414] to-[#0E0E0E] p-6 sm:p-8 shadow-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-[#121212] flex items-center justify-center border border-[#2F2F2F] text-[#3B82F6] shadow-inner">
          <BookOpen className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#E5E5E5] tracking-tight">
            Creator Guide &amp; Best Practices
          </h3>
          <p className="text-xs text-[#9CA3AF] font-medium">
            Expert recommendations for extracting panel assets, syncing audio
            narration, and rendering 4K videos.
          </p>
        </div>
      </div>

      <div className="flex border-b border-[#2F2F2F] overflow-x-auto">
        {[
          { id: "general", label: "General Workflow", icon: Layout },
          { id: "cropping", label: "Panel Extraction", icon: Scissors },
          { id: "audio", label: "Voice & Audio Sync", icon: Music },
          { id: "rendering", label: "HD Rendering & Output", icon: Settings },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeGuideTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveGuideTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                  : "border-transparent text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#262626]"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="min-h-[140px] flex items-center">
        {activeGuideTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in w-full">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono">
                The Three-Step Cycle
              </h4>
              <p className="text-xs text-[#E5E5E5] leading-relaxed font-medium">
                Start by scraping a webtoon episode or uploading a custom panel
                zip file. The system processes the images, extracts speech
                bubbles, and opens the timeline view.
              </p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed font-medium">
                Next, tweak panel animations, transitions, and audio sync inside
                the Video Studio. Lastly, trigger the final video rendering to
                export standard or 4K files.
              </p>
            </div>
            <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-[#2F2F2F] space-y-3 shadow-md">
              <h5 className="text-xs font-bold text-[#E5E5E5] flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#3B82F6]" /> Pipeline
                Metrics
              </h5>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#2F2F2F]">
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">
                    Avg Scrape Time
                  </p>
                  <p className="text-base font-black text-[#E5E5E5] font-mono mt-0.5">
                    ~12s
                  </p>
                </div>
                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#2F2F2F]">
                  <p className="text-[9px] font-bold text-[#9CA3AF] uppercase">
                    Avg Export Quality
                  </p>
                  <p className="text-base font-black text-[#3B82F6] font-mono mt-0.5">
                    4K UHD
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeGuideTab === "cropping" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in w-full">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono">
                Extraction &amp; Auto-Split
              </h4>
              <p className="text-xs text-[#E5E5E5] leading-relaxed font-medium font-sans">
                For vertical strip webtoons, keep{" "}
                <span className="text-[#3B82F6] font-bold">
                  Auto-Split Tall Strips
                </span>{" "}
                enabled. The system detects natural gutters and divides panels
                automatically.
              </p>
              <p className="text-xs text-[#9CA3AF] leading-relaxed font-medium font-sans">
                Tweak{" "}
                <span className="text-[#3B82F6] font-bold">
                  Crop Sensitivity
                </span>{" "}
                if panels are cut mid-scene. Higher sensitivity works better for
                standard grids, while lower values help with continuous action
                panels.
              </p>
            </div>
            <div className="space-y-2.5">
              <div className="p-3 bg-[#1E1E1E] rounded-xl border border-[#2F2F2F] text-[11px] font-medium text-[#E5E5E5] flex items-start gap-2.5 shadow-sm">
                <span className="text-[#3B82F6] font-black">Tip:</span> Use
                lower sensitivity for dramatic action scenes and higher
                sensitivity for rigid comic grids.
              </div>
              <div className="p-3 bg-[#1E1E1E] rounded-xl border border-[#2F2F2F] text-[11px] font-medium text-[#E5E5E5] flex items-start gap-2.5 shadow-sm">
                <span className="text-[#3B82F6] font-black">Note:</span>{" "}
                Page-based manga usually benefits from turning auto-splitting
                off for cleaner panel grouping.
              </div>
            </div>
          </div>
        )}

        {activeGuideTab === "audio" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in w-full">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono">
                Voiceover Sync
              </h4>
              <p className="text-xs text-[#E5E5E5] leading-relaxed font-medium">
                Align narration timing with panel transitions and scene changes.
                Longer narration works best for dramatic still frames, while
                concise beats suit action-heavy sequences.
              </p>
            </div>
            <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-4 space-y-3 shadow-md">
              <div className="text-[11px] text-[#9CA3AF] font-medium leading-relaxed">
                Match your narration style with the source material. A calm
                voiceover fits slice-of-life stories, while intense pacing helps
                combat scenes feel cinematic.
              </div>
            </div>
          </div>
        )}

        {activeGuideTab === "rendering" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in w-full">
            <div className="space-y-2">
              <h4 className="text-xs font-black text-[#3B82F6] uppercase tracking-widest font-mono">
                Export Workflow
              </h4>
              <p className="text-xs text-[#E5E5E5] leading-relaxed font-medium">
                Render in 1080p for quick previews, then switch to 4K once the
                edit is locked. This keeps iteration fast while preserving
                high-quality final exports.
              </p>
            </div>
            <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-4 text-[11px] text-[#9CA3AF] font-medium leading-relaxed shadow-md">
              Keep your audio mix normalized and color grading consistent across
              all panels so the export feels polished rather than assembled
              fragment-by-fragment.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatorGuideSection;
