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
    <div className="space-y-5 bg-white/[0.01] p-4 rounded-2xl border border-white/[0.05]">
      {activeTool === "edit" && (
        <>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-cyan-500/10 border border-cyan-500/15">
                <RotateCw className="h-3 w-3 text-cyan-400" />
              </div>
              <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
                Rotate &amp; Flip
              </span>
              {isTransforming && (
                <span className="ml-auto text-[8px] font-mono text-cyan-400 animate-pulse">
                  Applying…
                </span>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1.5">
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

          <SectionTitle icon={<Crop className="h-3 w-3 text-purple-400" />}>
            Target Platform Framing
          </SectionTitle>

          <div className="space-y-3 rounded-2xl border border-white/5 bg-black/20 p-3">
            <div className="grid grid-cols-1 gap-1.5">
              {FRAME_PRESETS.map((preset) => {
                const active = selectedFramePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleFramePresetChange(preset.id)}
                    className={`rounded-xl border px-3 py-2 text-left transition-all cursor-pointer ${
                      active
                        ? "bg-gradient-to-r border-purple-500/40 text-white shadow-[0_0_18px_rgba(139,92,246,0.15)]"
                        : "bg-black/20 border-white/5 text-neutral-400 hover:border-white/10 hover:text-neutral-200"
                    } ${preset.accent}`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-[0.2em] font-mono">
                      {preset.label}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-white/5 bg-black/30 p-2.5">
              <div className="mb-2 flex items-center gap-2 text-[9px] uppercase font-mono font-bold text-neutral-500">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                Padding Background Fill
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BACKGROUND_FILL_OPTIONS.map((option) => {
                  const active = backgroundFill === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setBackgroundFill(option)}
                      className={`rounded-lg border px-2.5 py-1.5 text-[9px] font-bold font-mono transition-all cursor-pointer ${
                        active
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                          : "bg-black/20 border-white/5 text-neutral-500 hover:text-neutral-200 hover:border-white/10"
                      }`}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-[9px] font-mono text-neutral-500">
              {presetSummary}
            </div>
          </div>

          <SectionTitle
            icon={<Crosshair className="h-3 w-3 text-violet-400" />}
          >
            Focal Point &amp; Safe Zones
          </SectionTitle>

          <div className="space-y-3 rounded-2xl border border-white/5 bg-black/20 p-3">
            <div className="flex items-center gap-2 text-[9px] uppercase font-mono text-neutral-500">
              <LayoutGrid className="h-3 w-3 text-violet-400" />
              Focal Point Picker
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {FOCAL_GRID.map((point) => {
                const active = selectedFocalPoint === point;
                return (
                  <button
                    key={point}
                    type="button"
                    onClick={() => setSelectedFocalPoint(point)}
                    className={`rounded-lg border px-2 py-2 text-[10px] font-mono font-bold transition-all cursor-pointer ${
                      active
                        ? "bg-violet-500/20 border-violet-500/40 text-violet-200"
                        : "bg-black/20 border-white/5 text-neutral-500 hover:border-white/10 hover:text-neutral-200"
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
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[10px] font-bold font-mono transition-all cursor-pointer ${
                showSafeZones
                  ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-200"
                  : "border-white/5 bg-black/20 text-neutral-500 hover:border-white/10 hover:text-neutral-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" />
                Show Shorts/Reels Safe Zone
              </span>
              <span>{showSafeZones ? "ON" : "OFF"}</span>
            </button>
          </div>

          <SectionTitle icon={<Sparkles className="h-3 w-3 text-amber-400" />}>
            Line Art &amp; Tone Polish
          </SectionTitle>

          <div className="space-y-2 rounded-2xl border border-white/5 bg-black/20 p-3">
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-900/30 bg-red-950/15 hover:bg-red-950/30 text-red-400/70 hover:text-red-300 text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95"
          >
            <RefreshCcw className="h-3 w-3" />
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
      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-[10px] font-bold font-mono transition-all cursor-pointer ${
        enabled
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : "border-white/5 bg-black/20 text-neutral-500 hover:border-white/10 hover:text-neutral-200"
      }`}
    >
      <span>{label}</span>
      <span>{enabled ? "ON" : "OFF"}</span>
    </button>
  );
}
