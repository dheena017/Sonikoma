import React from "react";
import { BookOpen, Layout, Scissors, Music, Settings, Sparkles } from "lucide-react";

export const CreatorGuideCard: React.FC = () => {
  const [activeGuideTab, setActiveGuideTab] = React.useState<string>("general");

  return (
    <div className="w-full bg-[#0a0a0f]/50 border border-neutral-800/80 rounded-[32px] p-6 sm:p-8 backdrop-blur-md space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-purple-600/20 flex items-center justify-center border border-purple-500/30">
          <BookOpen className="h-4 w-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Creator Guide & Best Practices
          </h3>
          <p className="text-xs text-neutral-400 font-medium">
            Expert recommendations for extracting panel assets, syncing audio narration, and rendering 4K videos.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-neutral-800 overflow-x-auto">
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
                  ? "border-purple-500 text-purple-300"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[140px] flex items-center">
        {activeGuideTab === "general" && (
          <div className="space-y-2 animate-in fade-in">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" /> End-to-End Pipeline Overview
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Paste a webtoon episode link to scrape all image strips automatically. The system will slice vertical panels, align dialog audio, generate voice narration, and prepare full video tracks for export.
            </p>
          </div>
        )}
        {activeGuideTab === "cropping" && (
          <div className="space-y-2 animate-in fade-in">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Scissors className="h-3.5 w-3.5 text-purple-400" /> Smart Edge Detection & Auto-Split
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Adjust crop sensitivity depending on background contrast. Increase sensitivity for dark webtoon panels and enable Auto-Split to break long continuous vertical strips into individual scene panels.
            </p>
          </div>
        )}
        {activeGuideTab === "audio" && (
          <div className="space-y-2 animate-in fade-in">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Music className="h-3.5 w-3.5 text-purple-400" /> AI Voice & BGM Synchronization
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Select your voice engine and narration style. The video pipeline auto-ducks ambient music whenever dialogue or narration plays to maintain high voice clarity.
            </p>
          </div>
        )}
        {activeGuideTab === "rendering" && (
          <div className="space-y-2 animate-in fade-in">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Settings className="h-3.5 w-3.5 text-purple-400" /> Hardware Accelerated Export
            </h4>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Export high-bitrate MP4 or WebM video formats. Choose vertical (9:16) for TikTok/Shorts/Reels or landscape (16:9) for standard YouTube recap videos.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
