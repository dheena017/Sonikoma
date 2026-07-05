import React from "react";
import { Sparkles, Wand2 } from "lucide-react";
import SectionTitle from "../../shared/SectionTitle";

interface Props {
  activeSlot: string | null;
  applyPreset: (preset: any) => void;
  firstImageUrl: string | null;
}

export function AutoCropPresetGrid({
  activeSlot,
  applyPreset,
  firstImageUrl,
}: Props) {
  const border = (slot: string) =>
    activeSlot === slot
      ? "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.12)]"
      : "border-neutral-800 hover:border-neutral-700";

  const presets = [
    {
      id: "standard",
      label: "⚖️ Standard Balanced",
      sub: "30% sens · 10px pad · Auto BG",
      config: {
        cropSensitivity: 30,
        cropPaddingPx: 10,
        cropBackgroundMode: "auto",
        aspectRatioLock: "free",
        autoSplitTallStrips: true,
        minPanelAreaPct: 1.5,
        overlapMergeThreshold: 30,
      },
    },
    {
      id: "webtoon",
      label: "⚡ Webtoon Strip Slicer",
      sub: "25% sens · 15px pad · Fast split",
      config: {
        cropSensitivity: 25,
        cropPaddingPx: 15,
        cropBackgroundMode: "auto",
        aspectRatioLock: "free",
        autoSplitTallStrips: true,
        minPanelAreaPct: 1.0,
        overlapMergeThreshold: 45,
      },
    },
    {
      id: "manga",
      label: "📖 Precise Manga",
      sub: "45% sens · 5px pad · White BG",
      config: {
        cropSensitivity: 45,
        cropPaddingPx: 5,
        cropBackgroundMode: "white",
        aspectRatioLock: "free",
        autoSplitTallStrips: false,
        minPanelAreaPct: 2.0,
        overlapMergeThreshold: 20,
      },
    },
    {
      id: "square",
      label: "🏁 Mobile Square (1:1)",
      sub: "30% sens · 12px pad · Square lock",
      config: {
        cropSensitivity: 30,
        cropPaddingPx: 12,
        cropBackgroundMode: "auto",
        aspectRatioLock: "1:1",
        autoSplitTallStrips: true,
        minPanelAreaPct: 1.5,
        overlapMergeThreshold: 35,
      },
    },
  ];

  const autoOptimize = async () => {
    if (!firstImageUrl) return;
    console.log(
      "[AutoCropPresetGrid] Auto-optimizing crop preset based on image ratio"
    );
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      console.log(
        `[AutoCropPresetGrid] Detected image ratio: ${ratio.toFixed(2)}`
      );
      if (ratio > 2.5)
        applyPreset({
          ...presets.find((p) => p.id === "webtoon")?.config,
          id: "webtoon",
        });
      else if (ratio < 0.8)
        applyPreset({
          ...presets.find((p) => p.id === "square")?.config,
          id: "square",
        });
      else
        applyPreset({
          ...presets.find((p) => p.id === "standard")?.config,
          id: "standard",
        });
    };
    img.src = firstImageUrl;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Sparkles className="h-3 w-3" />}>
          Crop Profile Presets
        </SectionTitle>
        <button
          onClick={autoOptimize}
          disabled={!firstImageUrl}
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-20"
        >
          <Wand2 className="h-2.5 w-2.5" />
          Auto-Optimize
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => applyPreset({ ...p.config, id: p.id })}
            className={`bg-neutral-950/40 border px-3 py-2.5 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl text-left transition-all cursor-pointer ${border(
              p.id
            )}`}
          >
            <span className="text-[11px] font-bold text-white block">
              {p.label}
            </span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">
              {p.sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
