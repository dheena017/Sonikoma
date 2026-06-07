import React, { useState } from "react";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  RefreshCcw,
  Lock,
  Unlock,
  ChevronsUpDown,
  Crop,
} from "lucide-react";

interface CropToolsPanelProps {
  editCropTop: number;
  editCropBottom: number;
  editCropLeft: number;
  editCropRight: number;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  zoom: number;
  setZoom: (v: number) => void;
  isTransforming: boolean;
  onRotate: (degrees: 90 | -90 | 180) => void;
  onFlip: (axis: "h" | "v") => void;
  onReset: () => void;
}

const CROP_PRESETS = [
  { label: "Free", icon: "⬜", top: 0, bottom: 0, left: 0, right: 0 },
  { label: "Square", icon: "⬛", top: 12.5, bottom: 12.5, left: 0, right: 0 },
  { label: "9:16", icon: "📱", top: 0, bottom: 0, left: 12.5, right: 12.5 },
  { label: "16:9", icon: "🖥", top: 21.9, bottom: 21.9, left: 0, right: 0 },
  { label: "4:3", icon: "📺", top: 12.5, bottom: 12.5, left: 0, right: 0 },
  { label: "3:4", icon: "📷", top: 0, bottom: 0, left: 12.5, right: 12.5 },
];

function NumericCropInput({
  label,
  value,
  onChange,
  color = "purple",
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  color?: string;
}) {
  const borderColor =
    color === "emerald"
      ? "border-emerald-800/40 focus:border-emerald-500/60"
      : color === "amber"
      ? "border-amber-800/40 focus:border-amber-500/60"
      : "border-purple-800/40 focus:border-purple-500/60";
  const textColor =
    color === "emerald"
      ? "text-emerald-400"
      : color === "amber"
      ? "text-amber-400"
      : "text-purple-400";

  return (
    <div className="flex flex-col gap-1">
      <span className={`text-[8px] font-bold uppercase tracking-widest font-mono ${textColor}`}>
        {label}
      </span>
      <div className="relative">
        <input
          type="number"
          min="0"
          max="90"
          step="0.5"
          value={value}
          onChange={(e) => {
            const v = Math.max(0, Math.min(90, parseFloat(e.target.value) || 0));
            onChange(parseFloat(v.toFixed(1)));
          }}
          className={`w-full bg-black/40 border ${borderColor} text-neutral-200 rounded-xl px-2.5 py-1.5 text-[11px] font-mono font-bold focus:outline-none transition-colors text-center`}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-neutral-600 font-mono pointer-events-none">
          %
        </span>
      </div>
    </div>
  );
}

export default function CropToolsPanel({
  editCropTop,
  editCropBottom,
  editCropLeft,
  editCropRight,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  zoom,
  setZoom,
  isTransforming,
  onRotate,
  onFlip,
  onReset,
}: CropToolsPanelProps) {
  const [aspectLocked, setAspectLocked] = useState(false);

  const handlePreset = (preset: (typeof CROP_PRESETS)[0]) => {
    setEditCropTop(preset.top);
    setEditCropBottom(preset.bottom);
    setEditCropLeft(preset.left);
    setEditCropRight(preset.right);
  };

  const cropWidth = parseFloat((100 - editCropLeft - editCropRight).toFixed(1));
  const cropHeight = parseFloat((100 - editCropTop - editCropBottom).toFixed(1));

  return (
    <div className="space-y-4 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
      {/* ── Rotate & Flip ── */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
            <RotateCw className="h-3 w-3 text-cyan-400" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Rotate &amp; Flip
          </span>
          {isTransforming && (
            <span className="ml-auto text-[8px] font-mono text-cyan-400 animate-pulse">Applying…</span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {/* Rotate CCW 90 */}
          <button
            type="button"
            onClick={() => onRotate(-90)}
            disabled={isTransforming}
            title="Rotate 90° Counter-Clockwise"
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black/30 hover:bg-cyan-500/10 border border-white/6 hover:border-cyan-500/30 rounded-xl text-neutral-500 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-[7px] font-mono">-90°</span>
          </button>

          {/* Rotate 180 */}
          <button
            type="button"
            onClick={() => onRotate(180)}
            disabled={isTransforming}
            title="Rotate 180°"
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black/30 hover:bg-cyan-500/10 border border-white/6 hover:border-cyan-500/30 rounded-xl text-neutral-500 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <ChevronsUpDown className="h-4 w-4" />
            <span className="text-[7px] font-mono">180°</span>
          </button>

          {/* Rotate CW 90 */}
          <button
            type="button"
            onClick={() => onRotate(90)}
            disabled={isTransforming}
            title="Rotate 90° Clockwise"
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black/30 hover:bg-cyan-500/10 border border-white/6 hover:border-cyan-500/30 rounded-xl text-neutral-500 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <RotateCw className="h-4 w-4" />
            <span className="text-[7px] font-mono">+90°</span>
          </button>

          {/* Flip H */}
          <button
            type="button"
            onClick={() => onFlip("h")}
            disabled={isTransforming}
            title="Flip Horizontal"
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black/30 hover:bg-violet-500/10 border border-white/6 hover:border-violet-500/30 rounded-xl text-neutral-500 hover:text-violet-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <FlipHorizontal className="h-4 w-4" />
            <span className="text-[7px] font-mono">Flip H</span>
          </button>

          {/* Flip V */}
          <button
            type="button"
            onClick={() => onFlip("v")}
            disabled={isTransforming}
            title="Flip Vertical"
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-black/30 hover:bg-violet-500/10 border border-white/6 hover:border-violet-500/30 rounded-xl text-neutral-500 hover:text-violet-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <FlipVertical className="h-4 w-4" />
            <span className="text-[7px] font-mono">Flip V</span>
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/5" />
        <div className="p-1 rounded-lg bg-purple-500/10 border border-purple-500/15">
          <Crop className="h-3 w-3 text-purple-400" />
        </div>
        <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
          Crop Bounds
        </span>
        <div className="h-px flex-1 bg-white/5" />
      </div>

      {/* ── Numeric Crop Inputs ── */}
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <NumericCropInput label="Top %" value={editCropTop} onChange={setEditCropTop} />
          <NumericCropInput label="Bottom %" value={editCropBottom} onChange={setEditCropBottom} />
          <NumericCropInput label="Left %" value={editCropLeft} onChange={setEditCropLeft} color="emerald" />
          <NumericCropInput label="Right %" value={editCropRight} onChange={setEditCropRight} color="emerald" />
        </div>

        {/* Live size readout */}
        <div className="flex items-center justify-between bg-black/30 border border-white/5 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setAspectLocked(!aspectLocked)}
              title={aspectLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                aspectLocked
                  ? "bg-amber-500/15 border-amber-600/40 text-amber-400"
                  : "bg-neutral-800/50 border-neutral-700/50 text-neutral-500 hover:text-neutral-300"
              }`}
            >
              {aspectLocked ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
            </button>
            <span className="text-[9px] text-neutral-500 font-mono">
              {aspectLocked ? "Ratio locked" : "Free ratio"}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-neutral-300">
            <span className="text-purple-400">{cropWidth}%</span>
            <span className="text-neutral-600 mx-1">×</span>
            <span className="text-emerald-400">{cropHeight}%</span>
          </span>
        </div>
      </div>

      {/* ── Crop Presets ── */}
      <div className="space-y-2">
        <span className="text-[9px] uppercase font-mono font-bold text-neutral-600 tracking-widest block">
          Quick Presets
        </span>
        <div className="grid grid-cols-3 gap-1.5">
          {CROP_PRESETS.map((preset) => {
            const isActive =
              Math.abs(editCropTop - preset.top) < 0.2 &&
              Math.abs(editCropBottom - preset.bottom) < 0.2 &&
              Math.abs(editCropLeft - preset.left) < 0.2 &&
              Math.abs(editCropRight - preset.right) < 0.2;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`flex flex-col items-center gap-1 py-2 px-1.5 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? "bg-purple-600/20 border-purple-500/50 text-white shadow-[0_0_12px_rgba(139,92,246,0.1)]"
                    : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-200 hover:bg-white/5 hover:border-white/10"
                }`}
              >
                <span className="text-base leading-none">{preset.icon}</span>
                <span className="text-[8px] font-mono font-bold">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Zoom Control ── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 justify-between">
          <span className="text-[9px] uppercase font-mono font-bold text-neutral-600 tracking-widest">
            Canvas Zoom
          </span>
          <span className="text-[10px] font-mono font-bold text-amber-400">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom(Math.max(0.5, parseFloat((zoom - 0.25).toFixed(2))))}
            className="p-1.5 rounded-lg bg-black/30 border border-white/6 hover:bg-amber-500/10 hover:border-amber-500/30 text-neutral-500 hover:text-amber-300 transition-all cursor-pointer active:scale-90"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 relative h-1.5 rounded-full bg-neutral-800/80 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${((zoom - 0.5) / 2) * 100}%`,
                background: "linear-gradient(to right, #d97706, #f59e0b)",
              }}
            />
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.25"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
            />
          </div>
          <button
            type="button"
            onClick={() => setZoom(Math.min(2.5, parseFloat((zoom + 0.25).toFixed(2))))}
            className="p-1.5 rounded-lg bg-black/30 border border-white/6 hover:bg-amber-500/10 hover:border-amber-500/30 text-neutral-500 hover:text-amber-300 transition-all cursor-pointer active:scale-90"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="text-[8px] font-mono px-2 py-1 rounded-lg bg-black/30 border border-white/6 hover:bg-amber-500/10 text-neutral-600 hover:text-amber-300 transition-all cursor-pointer"
          >
            1:1
          </button>
        </div>
      </div>

      {/* ── Reset All ── */}
      <button
        type="button"
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-900/30 bg-red-950/15 hover:bg-red-950/30 text-red-400/70 hover:text-red-300 text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95"
      >
        <RefreshCcw className="h-3 w-3" />
        Reset All Crop Bounds
      </button>
    </div>
  );
}
