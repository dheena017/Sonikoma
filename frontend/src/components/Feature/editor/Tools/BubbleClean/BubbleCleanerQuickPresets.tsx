import React from "react";
import { Sparkles } from "lucide-react";
import SectionTitle from "../../shared/SectionTitle";

interface Props {
  activeSlot: string | null;
  applyPreset: (preset: any) => void;
}

export function BubbleCleanerQuickPresets({ activeSlot, applyPreset }: Props) {
  const presets = [
    {
      id: "preset_auto",
      label: "✨ Standard Auto",
      sub: "All types · Auto Dispatch · 50% sens",
      config: {
        detectionStyle: "all",
        eraseMethod: "auto",
        sensitivity: 50,
        bubbleDilation: -1,
        bubbleInpaintRadius: 3,
      },
    },
    {
      id: "preset_white",
      label: "⬜ White Bubbles Only",
      sub: "White only · Inpaint · 3px dilation",
      config: {
        detectionStyle: "white_only",
        eraseMethod: "inpaint",
        sensitivity: 45,
        bubbleDilation: 3,
        bubbleInpaintRadius: 3,
      },
    },
    {
      id: "preset_blur",
      label: "🌫️ Narration Blur",
      sub: "Floating text · Gaussian Blur · 2px dil",
      config: {
        detectionStyle: "text_only",
        eraseMethod: "blur",
        sensitivity: 60,
        bubbleDilation: 2,
        bubbleInpaintRadius: 3,
      },
    },
    {
      id: "preset_silhouette",
      label: "🎭 Clean Silhouette",
      sub: "All types · Solid White Fill · 50% sens",
      config: {
        detectionStyle: "all",
        eraseMethod: "solid_white",
        sensitivity: 50,
        bubbleDilation: 2,
        bubbleInpaintRadius: 3,
      },
    },
  ];

  return (
    <div className="space-y-3">
      <SectionTitle icon={<Sparkles className="h-3 w-3 text-purple-400" />}>
        Quick Presets
      </SectionTitle>
      <div className="grid grid-cols-2 gap-2.5">
        {presets.map(({ id, label, sub, config }) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset({ ...config, id })}
            className={`bg-neutral-950/40 border px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${
              activeSlot === id
                ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.12)]"
                : "border-neutral-800 hover:border-neutral-700"
            }`}
          >
            <span className="text-[11px] font-bold text-white block">
              {label}
            </span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">
              {sub}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
