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
    <div className="p-3.5 flex flex-col gap-3.5 overflow-y-auto">
      {/* ── Target Video Format ── */}
      <div className="bg-[#121827] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-3 shadow-sm">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Tv size={14} className="text-sky-400" />
          <span>Target Video Format</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onAspectRatioChange("16:9")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "16:9"
                ? "bg-blue-950/80 border-blue-500 text-white shadow-sm"
                : "bg-[#0c101d] border-[#1e293b] text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-mono font-bold text-xs">16:9</span>
            <span className="text-[8px] text-slate-400 mt-0.5">YouTube</span>
          </button>

          <button
            type="button"
            onClick={() => onAspectRatioChange("9:16")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "9:16"
                ? "bg-blue-950/80 border-blue-500 text-white shadow-sm"
                : "bg-[#0c101d] border-[#1e293b] text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-mono font-bold text-xs">9:16</span>
            <span className="text-[8px] text-slate-400 mt-0.5">
              Shorts/Reels
            </span>
          </button>

          <button
            type="button"
            onClick={() => onAspectRatioChange("1:1")}
            className={`flex flex-col items-center p-2 rounded-lg border text-center transition-all cursor-pointer ${
              aspectRatio === "1:1"
                ? "bg-blue-950/80 border-blue-500 text-white shadow-sm"
                : "bg-[#0c101d] border-[#1e293b] text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="font-mono font-bold text-xs">1:1</span>
            <span className="text-[8px] text-slate-400 mt-0.5">Square</span>
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#182236]">
          <div>
            <span className="text-xs font-semibold text-slate-200 block">
              Burn-in Animated Subtitles
            </span>
            <span className="text-[9px] text-slate-400">
              Render anime dialogue captions on-screen
            </span>
          </div>
          <input
            type="checkbox"
            checked={showSubtitles}
            onChange={(e) => onShowSubtitlesChange(e.target.checked)}
            className="w-4 h-4 accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* ── Production Blueprint ── */}
      <div className="bg-[#121827] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2 shadow-sm">
        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
          <Film size={14} className="text-amber-400" />
          <span>Production Blueprint</span>
        </h3>

        <div className="flex flex-col gap-1 text-[10px] text-slate-300 font-mono bg-[#0c101d] p-2.5 rounded-lg border border-[#1e293b]">
          <div className="flex justify-between">
            <span className="text-slate-500">Active Scenes:</span>
            <span className="text-white font-bold">{enabledCount} Scenes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Total Duration:</span>
            <span className="text-sky-400 font-bold">
              {totalDuration.toFixed(1)}s
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Soundtrack Mood:</span>
            <span className="text-emerald-400 font-bold capitalize">
              {bgmMood}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Video Aspect:</span>
            <span className="text-white font-bold">{aspectRatio}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
