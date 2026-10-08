import React from "react";
import { Tv, Film } from "lucide-react";

export interface ExportViewProps {
  aspectRatio: "16:9" | "9:16" | "1:1";
  showSubtitles: boolean;
  enabledCount: number;
  totalDuration: number;
  bgmMood: string;
  onAspectRatioChange: (ratio: "16:9" | "9:16" | "1:1") => void;
  onShowSubtitlesChange: (show: boolean) => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  aspectRatio,
  showSubtitles,
  enabledCount,
  totalDuration,
  bgmMood,
  onAspectRatioChange,
  onShowSubtitlesChange,
}) => {
  return (
    <div className="p-3.5 flex flex-col gap-3.5 overflow-y-auto bg-[#0a0a0a]">
      {/* ── Target Video Format ── */}
      <div className="bg-[#181818] border border-[#2f2f2f] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <h3 className="text-xs font-bold text-[#e5e5e5] flex items-center gap-1.5">
          <Tv size={14} className="text-blue-400" />
          <span>Target Video Format</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onAspectRatioChange("16:9")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "16:9"
                ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                : "bg-[#121212] border-[#2f2f2f] text-[#9ca3af] hover:text-[#e5e5e5] hover:border-[#3f3f3f]"
            }`}
          >
            <span className="font-mono font-bold text-xs">16:9</span>
            <span className="text-[8px] text-[#9ca3af] mt-0.5">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => onAspectRatioChange("9:16")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "9:16"
                ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                : "bg-[#121212] border-[#2f2f2f] text-[#9ca3af] hover:text-[#e5e5e5] hover:border-[#3f3f3f]"
            }`}
          >
            <span className="font-mono font-bold text-xs">9:16</span>
            <span className="text-[8px] text-[#9ca3af] mt-0.5">
              Shorts/Reels
            </span>
          </button>

          <button
            type="button"
            onClick={() => onAspectRatioChange("1:1")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "1:1"
                ? "bg-blue-600/20 border-blue-500 text-white shadow-sm"
                : "bg-[#121212] border-[#2f2f2f] text-[#9ca3af] hover:text-[#e5e5e5] hover:border-[#3f3f3f]"
            }`}
          >
            <span className="font-mono font-bold text-xs">1:1</span>
            <span className="text-[8px] text-[#9ca3af] mt-0.5">Square</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#262626]">
          <div>
            <span className="text-xs font-semibold text-[#e5e5e5] block">
              Burn-in Animated Subtitles
            </span>
            <span className="text-[9px] text-[#9ca3af]">
              Render anime dialogue captions on-screen
            </span>
          </div>
          <input
            type="checkbox"
            checked={showSubtitles}
            onChange={(e) => onShowSubtitlesChange(e.target.checked)}
            className="w-4 h-4 accent-blue-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ── Production Blueprint ── */}
      <div className="bg-[#181818] border border-[#2f2f2f] rounded-xl p-3 flex flex-col gap-2 shadow-sm">
        <h3 className="text-xs font-bold text-[#e5e5e5] flex items-center gap-1.5">
          <Film size={14} className="text-blue-400" />
          <span>Production Blueprint</span>
        </h3>

        <div className="flex flex-col gap-1 text-[10px] text-[#e5e5e5] font-mono bg-[#121212] p-2.5 rounded-lg border border-[#2f2f2f]">
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Active Scenes:</span>
            <span className="text-[#e5e5e5] font-bold">{enabledCount} Scenes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Total Duration:</span>
            <span className="text-blue-400 font-bold">
              {totalDuration.toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Soundtrack Mood:</span>
            <span className="text-emerald-400 font-bold capitalize">
              {bgmMood}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#9ca3af]">Video Aspect:</span>
            <span className="text-[#e5e5e5] font-bold">{aspectRatio}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
