import React from "react";
import { Cpu } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { DETECTION_OPTIONS } from "./bubbleCleanerConfig";
import { DetectionStyle } from "./tabTypes";

interface Props {
  detectionStyle: DetectionStyle;
  setDetectionStyle: (v: DetectionStyle) => void;
}

export function BubbleCleanerDetectionStyle({
  detectionStyle,
  setDetectionStyle,
}: Props) {
  return (
    <div className="space-y-3">
      <SectionTitle icon={<Cpu className="h-3 w-3 text-purple-400" />}>
        What to Detect
      </SectionTitle>
      <div className="flex flex-col gap-2.5">
        {DETECTION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDetectionStyle(opt.value as DetectionStyle)}
            className={`flex items-start gap-4 px-5 py-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              detectionStyle === opt.value
                ? "bg-purple-950/15 border-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.1)]"
                : "bg-neutral-950/30 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
            }`}
          >
            <div
              className={`mt-1 h-3 w-3 shrink-0 rounded-full ${opt.dot} ${
                detectionStyle === opt.value
                  ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-purple-500"
                  : ""
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-1">
                <span
                  className={`text-[12px] font-bold font-mono ${
                    detectionStyle === opt.value
                      ? "text-white"
                      : "text-neutral-300"
                  }`}
                >
                  {opt.label}
                </span>
                <span
                  className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${opt.badgeColor}`}
                >
                  {opt.badge}
                </span>
              </div>
              <p className="text-[9px] text-neutral-500 font-sans leading-normal">
                {opt.hint}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
