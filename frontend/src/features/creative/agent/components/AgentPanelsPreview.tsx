import React from "react";
import { Film, Clock, MoveRight, Volume2 } from "lucide-react";
import { AgentPanel } from "../types";

interface AgentPanelsPreviewProps {
  panels: AgentPanel[];
  scrapedTitle?: string;
}

export const AgentPanelsPreview: React.FC<AgentPanelsPreviewProps> = ({
  panels,
  scrapedTitle,
}) => {
  if (!panels || panels.length === 0) return null;

  return (
    <div className="bg-[#1E1E1E] border border-[#2F2F2F] rounded-2xl p-6 sm:p-7 shadow-md space-y-4">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {panels.map((p) => (
          <div
            key={p.index}
            className="group rounded-xl overflow-hidden border border-[#2F2F2F] bg-[#121212] hover:border-[#3B82F6]/60 transition-all flex flex-col"
          >
            {/* Panel Image */}
            <div className="relative aspect-[4/3] bg-black overflow-hidden">
              <img
                src={p.image_url}
                alt={`Panel #${p.index}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-[#E5E5E5] border border-[#2F2F2F]">
                #{p.index}
              </div>
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#3B82F6] text-[9px] font-mono font-bold text-white uppercase shadow-md">
                {p.motion_type || "zoom_in"}
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
    </div>
  );
};

export default AgentPanelsPreview;
