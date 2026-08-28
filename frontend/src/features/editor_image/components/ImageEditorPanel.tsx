import React, { useState } from "react";
import { useImageEditorStore } from "@/features/editor_image/hooks/useImageEditorState";
import SectionTitle from "@/features/editor_image/components/SectionTitle";
import {
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RefreshCcw,
  ChevronsUpDown,
  Crop,
  Sparkles,
  Crosshair,
  Shield,
  LayoutGrid,
} from "lucide-react";

interface ImageEditorPanelProps {
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
  handleNudge: (
    direction: "top" | "bottom" | "left" | "right",
    amount: number
  ) => void;
}

const FRAME_PRESETS = [
  {
    id: "youtube",
    label: "16:9 YouTube",
    accent: "from-cyan-500/30 to-blue-500/20",
  },
  {
    id: "shorts",
    label: "9:16 Shorts/TikTok",
    accent: "from-pink-500/30 to-fuchsia-500/20",
  },
  {
    id: "social",
    label: "1:1 Social",
    accent: "from-violet-500/30 to-purple-500/20",
  },
] as const;

const BACKGROUND_FILL_OPTIONS = [
  "Solid Color",
  "Blurred Image Background",
  "Transparent",
] as const;

const FOCAL_GRID = [
  "TL",
  "TC",
  "TR",
  "ML",
  "MC",
  "MR",
  "BL",
  "BC",
  "BR",
] as const;

export default function ImageEditorPanel({
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
  handleNudge,
}: ImageEditorPanelProps) {
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const selectedFocalPoint = useImageEditorStore(
    (state) => state.selectedFocalPoint
  );
  const setSelectedFocalPoint = useImageEditorStore(
    (state) => state.setSelectedFocalPoint
  );
  const showSafeZones = useImageEditorStore((state) => state.showSafeZones);
  const setShowSafeZones = useImageEditorStore(
    (state) => state.setShowSafeZones
  );
  const lineSharpen = useImageEditorStore((state) => state.lineSharpen);
  const setLineSharpen = useImageEditorStore((state) => state.setLineSharpen);
  const mangaContrast = useImageEditorStore((state) => state.mangaContrast);
  const setMangaContrast = useImageEditorStore(
    (state) => state.setMangaContrast
  );
  const popColorBoost = useImageEditorStore((state) => state.popColorBoost);
  const setPopColorBoost = useImageEditorStore(
    (state) => state.setPopColorBoost
  );
  const [selectedFramePreset, setSelectedFramePreset] =
    useState<(typeof FRAME_PRESETS)[number]["id"]>("youtube");
  const [backgroundFill, setBackgroundFill] = useState<
    (typeof BACKGROUND_FILL_OPTIONS)[number]
  >("Blurred Image Background");

  const handleFramePresetChange = (
    presetId: (typeof FRAME_PRESETS)[number]["id"]
  ) => {
    setSelectedFramePreset(presetId);

    if (presetId === "youtube") {
      setEditCropTop(10);
      setEditCropBottom(10);
      setEditCropLeft(0);
      setEditCropRight(0);
    } else if (presetId === "shorts") {
      setEditCropTop(0);
      setEditCropBottom(0);
      setEditCropLeft(12.5);
      setEditCropRight(12.5);
    } else {
      setEditCropTop(10);
      setEditCropBottom(10);
      setEditCropLeft(10);
      setEditCropRight(10);
    }
  };

  const presetSummary =
    selectedFramePreset === "youtube"
      ? "Letterbox for wide cinematic framing"
      : selectedFramePreset === "shorts"
      ? "Centred vertical deck for phone-first delivery"
      : "Balanced stack for social posts and avatars";

  return (
    <div className="space-y-4 font-sans text-left">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Crop className="h-4 w-4" />
          </div>
          <span className="text-xs uppercase font-mono font-bold text-white tracking-wider">
            Rotate &amp; Crop
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white text-[10px] font-mono transition-all cursor-pointer active:scale-95"
          title="Reset All Adjustments"
        >
          <RefreshCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {activeTool === "edit" && (
        <>
          {/* Rotate & Flip Card */}
          <div className="bg-[#181924]/60 border border-white/10 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <RotateCw className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold text-white tracking-widest">
                Rotate &amp; Flip
              </span>
              {isTransforming && (
                <span className="ml-auto text-[8px] font-mono text-cyan-400 animate-pulse">
                  Applying…
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => onRotate(-90)}
                disabled={isTransforming}
                title="Rotate 90° Counter-Clockwise"
                className="flex flex-col items-center justify-center gap-1 py-3 bg-[#10111a]/80 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-2xl text-neutral-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="text-[7.5px] font-mono font-bold">-90°</span>
              </button>

              <button
                type="button"
                onClick={() => onRotate(180)}
                disabled={isTransforming}
                title="Rotate 180°"
                className="flex flex-col items-center justify-center gap-1 py-3 bg-[#10111a]/80 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-2xl text-neutral-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                <ChevronsUpDown className="h-4 w-4" />
                <span className="text-[7.5px] font-mono font-bold">180°</span>
              </button>

              <button
                type="button"
                onClick={() => onRotate(90)}
                disabled={isTransforming}
                title="Rotate 90° Clockwise"
                className="flex flex-col items-center justify-center gap-1 py-3 bg-[#10111a]/80 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-2xl text-neutral-400 hover:text-cyan-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                <RotateCw className="h-4 w-4" />
                <span className="text-[7.5px] font-mono font-bold">+90°</span>
              </button>

              <button
                type="button"
                onClick={() => onFlip("h")}
                disabled={isTransforming}
                title="Flip Horizontal"
                className="flex flex-col items-center justify-center gap-1 py-3 bg-[#10111a]/80 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-2xl text-neutral-400 hover:text-purple-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                <FlipHorizontal className="h-4 w-4" />
                <span className="text-[7.5px] font-mono font-bold">Flip H</span>
              </button>

              <button
                type="button"
                onClick={() => onFlip("v")}
                disabled={isTransforming}
                title="Flip Vertical"
                className="flex flex-col items-center justify-center gap-1 py-3 bg-[#10111a]/80 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/30 rounded-2xl text-neutral-400 hover:text-purple-300 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
              >
                <FlipVertical className="h-4 w-4" />
                <span className="text-[7.5px] font-mono font-bold">Flip V</span>
              </button>
            </div>
          </div>

          {/* Target Platform Framing Section */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-1.5">
              <Crop className="h-3 w-3" /> Target Platform Framing
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="space-y-3 bg-[#181924]/60 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="grid grid-cols-1 gap-2">
              {FRAME_PRESETS.map((preset) => {
                const active = selectedFramePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleFramePresetChange(preset.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-all cursor-pointer ${
                      active
                        ? "bg-blue-950/40 border-blue-500/60 text-blue-200 shadow-[0_0_18px_rgba(59,130,246,0.3)] font-bold"
                        : "bg-[#10111a]/80 border-white/5 text-neutral-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    <div className="text-xs font-bold uppercase tracking-[0.18em] font-mono">
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-white/5 bg-[#10111a]/80 p-3 space-y-2.5">
              <div className="flex items-center gap-2 text-[9px] uppercase font-mono font-bold text-neutral-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Padding Background Fill
              </div>
              <div className="flex flex-wrap gap-2">
                {BACKGROUND_FILL_OPTIONS.map((option) => {
                  const active = backgroundFill === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBackgroundFill(option)}
                      className={`rounded-xl border px-3 py-1.5 text-[9.5px] font-bold font-mono transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                          : "bg-black/30 border-white/5 text-neutral-400 hover:text-white hover:border-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[9.5px] font-mono text-neutral-400 pt-0.5">
              {presetSummary}
            </div>
          </div>

          {/* Focal Point & Safe Zones Section */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-1.5">
              <Crosshair className="h-3 w-3" /> Focal Point &amp; Safe Zones
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="space-y-3 bg-[#181924]/60 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 text-[9px] uppercase font-mono font-bold text-neutral-400">
              <LayoutGrid className="h-3.5 w-3.5 text-purple-400" />
              Focal Point Picker
            </div>
            <div className="grid grid-cols-3 gap-2">
              {FOCAL_GRID.map((point) => {
                const active = selectedFocalPoint === point;
                return (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setSelectedFocalPoint(point)}
                    className={`rounded-xl border py-2.5 text-xs font-mono font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-purple-950/60 border-purple-500/60 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.35)]"
                        : "bg-[#10111a]/80 border-white/5 text-neutral-400 hover:border-white/15 hover:text-white"
                    }`}
                  >
                    {point}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setShowSafeZones(!showSafeZones)}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold font-mono transition-all cursor-pointer ${
                showSafeZones
                  ? "border-cyan-500/50 bg-cyan-950/30 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "border-white/5 bg-[#10111a]/80 text-neutral-400 hover:border-white/15 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-neutral-400" />
                Show Shorts/Reels Safe Zone
              </span>
              <span className={showSafeZones ? "text-cyan-300 font-black" : "text-neutral-500"}>
                {showSafeZones ? "ON" : "OFF"}
              </span>
            </button>
          </div>

          {/* Line Art & Tone Polish Section */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Line Art &amp; Tone Polish
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <div className="space-y-2 bg-[#181924]/60 border border-white/10 rounded-2xl p-4 shadow-xl">
            <ToggleRow
              label="Line Sharpen"
              enabled={lineSharpen}
              onToggle={() => setLineSharpen(!lineSharpen)}
            />
            <ToggleRow
              label="Manga Contrast"
              enabled={mangaContrast}
              onToggle={() => setMangaContrast(!mangaContrast)}
            />
            <ToggleRow
              label="Pop Color Boost"
              enabled={popColorBoost}
              onToggle={() => setPopColorBoost(!popColorBoost)}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedFramePreset("youtube");
              setBackgroundFill("Blurred Image Background");
              setSelectedFocalPoint("MC");
              setShowSafeZones(true);
              setLineSharpen(true);
              setMangaContrast(true);
              setPopColorBoost(false);
              onReset();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-red-400/80 hover:text-red-300 text-xs font-bold font-mono transition-all cursor-pointer active:scale-95"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Reset Framing
          </button>
        </>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-xs font-bold font-mono transition-all cursor-pointer ${
        enabled
          ? "border-amber-500/50 bg-amber-950/30 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
          : "border-white/5 bg-[#10111a]/80 text-neutral-400 hover:border-white/15 hover:text-white"
      }`}
    >
      <span>{label}</span>
      <span className={enabled ? "text-amber-300 font-black" : "text-neutral-500"}>
        {enabled ? "ON" : "OFF"}
      </span>
    </button>
  );
}
