import React, { useState } from "react";
import { Film, Clock, Volume2, Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { AgentPanel } from "../types";

interface AgentPanelsPreviewProps {
  panels: AgentPanel[];
  scrapedTitle?: string;
}

export const AgentPanelsPreview: React.FC<AgentPanelsPreviewProps> = ({
  panels,
  scrapedTitle,
}) => {
  const [selectedPanel, setSelectedPanel] = useState<AgentPanel | null>(null);

  if (!panels || panels.length === 0) return null;

  const currentIndex = selectedPanel ? panels.findIndex((p) => p.index === selectedPanel.index) : -1;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex > 0) {
      setSelectedPanel(panels[currentIndex - 1]);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentIndex >= 0 && currentIndex < panels.length - 1) {
      setSelectedPanel(panels[currentIndex + 1]);
    }
  };

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-4 text-left">
      <div className="flex items-center justify-between pb-3 border-b border-[#2F2F2F]">
        <div>
          <h3 className="text-sm font-bold text-[#E5E5E5] flex items-center gap-2">
            <Film className="w-4 h-4 text-[#3B82F6]" />
            Extracted Story Panels &amp; Narration Script
          </h3>
          <p className="text-xs text-[#9CA3AF] mt-0.5 font-sans">
            {panels.length} clean panels cropped &amp; synchronized for {scrapedTitle || "Story Recap"}
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#121212] border border-[#2F2F2F] text-[#9CA3AF]">
          Total Duration:{" "}
          {panels.reduce((acc, p) => acc + (p.duration || 3.5), 0).toFixed(1)}s
        </span>
      </div>

      {/* Grid of Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {panels.map((p) => (
          <div
            key={p.index}
            className="group rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#121212] hover:border-[#3B82F6]/60 transition-all flex flex-col"
          >
            {/* Panel Image Container - object-contain ensures 100% full image is visible with no cropping */}
            <div
              onClick={() => setSelectedPanel(p)}
              className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden cursor-zoom-in"
              title="Click to view full panel"
            >
              <img
                src={p.image_url}
                alt={`Panel #${p.index}`}
                className="w-full h-full object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />

              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/85 backdrop-blur-sm text-[10px] font-mono font-bold text-[#E5E5E5] border border-[#2F2F2F]">
                #{p.index}
              </div>

              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#3B82F6] text-[9px] font-mono font-bold text-white uppercase shadow-md">
                {p.motion_type || "zoom_in"}
              </div>

              {/* Hover Zoom Prompt */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="p-1.5 rounded-full bg-black/70 text-white/90 border border-white/20">
                  <Maximize2 className="w-4 h-4" />
                </span>
              </div>
            </div>

            {/* Script Text */}
            <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
              <p className="text-xs text-[#E5E5E5] line-clamp-3 leading-relaxed font-sans">
                {p.speech_text || "Visual action sequence."}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#1E1E1E] text-[10px] text-[#9CA3AF] font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#6B7280]" />
                  {p.duration.toFixed(1)}s
                </span>
                {p.audio_url && (
                  <span className="flex items-center gap-1 text-[#10B981] font-bold">
                    <Volume2 className="w-3 h-3" /> Voice Synced
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Image Lightbox Modal */}
      {selectedPanel && (
        <div
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPanel(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-neutral-950 border border-[#2F2F2F] rounded-2xl p-4 flex flex-col items-center gap-3 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#3B82F6] text-xs font-mono font-bold text-white">
                  Panel #{selectedPanel.index}
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  {selectedPanel.motion_type || "zoom_in"} • {selectedPanel.duration.toFixed(1)}s
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPanel(null)}
                className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Full Image */}
            <div className="relative max-h-[70vh] flex items-center justify-center overflow-auto w-full">
              <img
                src={selectedPanel.image_url}
                alt={`Panel #${selectedPanel.index}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg border border-neutral-800"
              />

              {/* Prev / Next Controls */}
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
                  title="Previous Panel"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentIndex >= 0 && currentIndex < panels.length - 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 p-2 rounded-full bg-black/70 hover:bg-black text-white border border-white/20 transition-all cursor-pointer"
                  title="Next Panel"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Script Details */}
            <div className="w-full bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 text-left">
              <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans">
                {selectedPanel.speech_text || "Visual action sequence."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPanelsPreview;
