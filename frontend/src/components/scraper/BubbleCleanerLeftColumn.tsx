import React from "react";
import SectionTitle from "../crop/SectionTitle";

interface BubbleCleanerLeftColumnProps {
  detectionStyle: "all" | "white_only" | "text_only";
  setDetectionStyle: (v: "all" | "white_only" | "text_only") => void;
  eraseMethod: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black";
  setEraseMethod: (
    v: "auto" | "inpaint" | "blur" | "solid_white" | "solid_black"
  ) => void;
}

import { DETECTION_OPTIONS, ERASE_OPTIONS } from "./bubbleCleanerConfig";

export default function BubbleCleanerLeftColumn({
  detectionStyle,
  setDetectionStyle,
  eraseMethod,
  setEraseMethod,
}: BubbleCleanerLeftColumnProps) {
  return (
    <div className="lg:col-span-7 space-y-8">
      {/* SECTION 1: DETECTION STYLE */}
      <div className="space-y-3">
        <SectionTitle>What to Detect</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {DETECTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDetectionStyle(opt.value)}
              className={`flex items-start gap-4 px-5 py-4 rounded-2xl border text-left transition-all cursor-pointer ${
                detectionStyle === opt.value
                  ? "bg-purple-900/25 border-purple-500 shadow-[0_0_18px_rgba(168,85,247,0.08)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
              }`}
            >
              <div
                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${opt.dot} ${
                  detectionStyle === opt.value
                    ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-purple-500"
                    : ""
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
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
                    className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${opt.badgeColor}`}
                  >
                    {opt.badge}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                  {opt.hint}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: ERASE METHOD */}
      <div className="space-y-3">
        <SectionTitle>How to Erase</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ERASE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setEraseMethod(opt.value)}
              className={`flex flex-col gap-1.5 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                eraseMethod === opt.value
                  ? "bg-indigo-900/25 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.08)]"
                  : "bg-neutral-950/50 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{opt.icon}</span>
                <span
                  className={`text-[11px] font-bold font-mono ${
                    eraseMethod === opt.value
                      ? "text-white"
                      : "text-neutral-300"
                  }`}
                >
                  {opt.label}
                </span>
                {opt.badge && (
                  <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded border bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-mono font-bold uppercase tracking-wider">
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-500 font-sans leading-relaxed">
                {opt.hint}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
