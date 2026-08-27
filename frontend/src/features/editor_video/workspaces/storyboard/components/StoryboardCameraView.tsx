import React from "react";
import {
  Camera,
  ZoomIn,
  ZoomOut,
  ArrowDown,
  ArrowUp,
  Activity,
  Sliders,
  Move,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { GeneratedPanel } from "@/types";

interface StoryboardCameraViewProps {
  panels: GeneratedPanel[];
  selectedIndices: number[];
  onSelect: (index: number, e: React.MouseEvent) => void;
  onUpdateCameraMotion: (index: number, motion: string) => void;
  onUpdateDuration: (index: number, duration: number) => void;
  onTriggerFeedback?: (msg: string) => void;
}

const MOTION_PRESETS = [
  { id: "Slow Zoom In", label: "Zoom In", icon: ZoomIn },
  { id: "Slow Zoom Out", label: "Zoom Out", icon: ZoomOut },
  { id: "Pan Down", label: "Pan Down", icon: ArrowDown },
  { id: "Pan Up", label: "Pan Up", icon: ArrowUp },
  { id: "Camera Shake", label: "Shake", icon: Activity },
  { id: "Static View", label: "Static", icon: Move },
];

export const StoryboardCameraView: React.FC<StoryboardCameraViewProps> = ({
  panels,
  selectedIndices,
  onSelect,
  onUpdateCameraMotion,
  onUpdateDuration,
  onTriggerFeedback,
}) => {
  return (
    <div className="space-y-3 pt-1 pb-4">
      {/* Banner */}
      <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-indigo-200">
          <Camera className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
          <span>Cinematic Camera Director — Assign 3D pans, zooms & timing</span>
        </div>
      </div>

      {panels.map((panel, index) => {
        const isSelected = selectedIndices.includes(index);
        const imgUrl = panel.image_url || (panel as any).imageUrl || "";
        const displayUrl = getProxiedImageUrl(imgUrl);
        const currentMotion = panel.motion_type || (panel as any).camera_motion || "Slow Zoom In";
        const duration = panel.duration || 3.5;

        return (
          <div
            key={`camera-row-${panel.id || index}`}
            onClick={(e) => onSelect(index, e)}
            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
              isSelected
                ? "border-indigo-500 bg-indigo-950/25 ring-2 ring-indigo-500/50 shadow-md"
                : "border-white/10 bg-[#0c0d1b] hover:border-indigo-500/40"
            }`}
          >
            {/* Top row: Thumbnail + Duration Slider */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[7px] font-black font-mono bg-black/80 text-indigo-200 px-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold font-mono text-indigo-300">
                    Panel #{index + 1}
                  </span>
                  <p className="text-[8px] font-mono text-neutral-400">
                    Active: <span className="text-white font-bold">{currentMotion}</span>
                  </p>
                </div>
              </div>

              {/* Duration pill & quick increment */}
              <div className="flex items-center gap-1 bg-black/50 p-1 px-2 rounded-xl border border-white/10 text-[9px] font-mono text-neutral-300">
                <span>{duration}s</span>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={duration}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => {
                    const next = parseFloat(e.target.value);
                    onUpdateDuration(index, next);
                  }}
                  className="w-14 accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Motion Presets Grid */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {MOTION_PRESETS.map((preset) => {
                const Icon = preset.icon;
                const isActive = currentMotion === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateCameraMotion(index, preset.id);
                      onTriggerFeedback?.(`Assigned ${preset.label} to Panel #${index + 1}`);
                    }}
                    className={`py-1.5 px-2 rounded-xl border text-[9px] font-mono font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isActive
                        ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                        : "bg-black/40 border-white/5 text-neutral-400 hover:text-white hover:bg-black/70 hover:border-white/20"
                    }`}
                  >
                    <Icon className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StoryboardCameraView;
