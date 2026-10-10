import React from "react";
import { Check, X, Clock, Zap, ArrowRight } from "lucide-react";

interface ComparisonSectionProps {
  themeMode?: "dark" | "light";
  onGetStarted: () => void;
}

export function ComparisonSection({
  themeMode = "dark",
  onGetStarted,
}: ComparisonSectionProps) {
  const isLight = themeMode === "light";

  const comparisonRows = [
    {
      feature: "Time per Comic Chapter",
      traditional: "4 to 6 hours of manual slicing & keyframing",
      sonikoma: "Under 60 seconds end-to-end",
      highlight: true,
    },
    {
      feature: "Panel Slicing & Separation",
      traditional: "Manual rectangle crop in Photoshop panel by panel",
      sonikoma: "Zero-gap Vision AI auto-segmentation in 1 click",
    },
    {
      feature: "Speech Bubble Removal",
      traditional: "Tedious clone stamp & healing brush painting",
      sonikoma: "Gemini Vision neural inpainting with zero texture loss",
    },
    {
      feature: "Voice Dubbing & Narration",
      traditional: "Expensive voice actors or flat robotic text-to-speech",
      sonikoma: "50+ natural multi-character voices with emotional tone",
    },
    {
      feature: "Camera Motion & Choreography",
      traditional: "Manual keyframe timeline adjustment & bezier curves",
      sonikoma: "Dynamic camera presets (Vertical Glide, Punch Zoom, Shake)",
    },
    {
      feature: "Manga & Manhwa Translation",
      traditional: "Manual OCR, copy-pasting translation & typing subs",
      sonikoma: "Built-in Korean/Japanese OCR + synced anime subtitles",
    },
    {
      feature: "Hardware & Software Requirements",
      traditional: "Heavy desktop GPU, Adobe Creative Cloud subscription",
      sonikoma: "Runs in any web browser — fast cloud rendering",
    },
  ];

  return (
    <section id="comparison" className="py-24 px-4 sm:px-6 relative z-10 scroll-mt-24">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* SECTION HEADER */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider border ${
              isLight
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Workflow Revolution</span>
          </div>

          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-black tracking-tight ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            Why Creators Switch to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Sonikoma
            </span>
          </h2>

          <p
            className={`text-sm sm:text-base leading-relaxed ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            Compare the grueling manual video editing workflow with Sonikoma's
            automated comic-to-video AI pipeline.
          </p>
        </div>

        {/* COMPARISON TABLE CARD */}
        <div
          className={`rounded-[32px] border overflow-hidden shadow-2xl backdrop-blur-xl transition-all ${
            isLight
              ? "bg-white border-slate-200 shadow-slate-200/60"
              : "bg-[#11131a] border-white/10 shadow-black/80"
          }`}
        >
          {/* Table Header */}
          <div className="grid grid-cols-1 md:grid-cols-12 border-b border-black/5 dark:border-white/10">
            <div className="md:col-span-4 p-5 sm:p-6 text-xs font-bold uppercase tracking-wider text-neutral-400 hidden md:block">
              Capability
            </div>
            <div
              className={`md:col-span-4 p-5 sm:p-6 border-b md:border-b-0 md:border-l border-black/5 dark:border-white/10 text-center ${
                isLight ? "bg-slate-50" : "bg-neutral-900/50"
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-rose-500 font-bold text-sm sm:text-base">
                <X className="w-4 h-4" />
                <span>Manual Video Editing</span>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1">
                Photoshop + Premiere / CapCut
              </p>
            </div>
            <div
              className={`md:col-span-4 p-5 sm:p-6 border-b md:border-b-0 md:border-l border-black/5 dark:border-white/10 text-center ${
                isLight ? "bg-blue-50/70" : "bg-blue-600/10"
              }`}
            >
              <div className="flex items-center justify-center gap-2 text-blue-400 font-bold text-sm sm:text-base">
                <Zap className="w-4 h-4 text-blue-400 fill-blue-400" />
                <span>Sonikoma AI Studio</span>
              </div>
              <p className="text-[11px] text-blue-400 mt-1 font-semibold">
                Automated 1-Click Pipeline
              </p>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {comparisonRows.map((row, index) => (
              <div
                key={index}
                className={`grid grid-cols-1 md:grid-cols-12 items-center transition-colors ${
                  row.highlight
                    ? isLight
                      ? "bg-blue-50/40"
                      : "bg-blue-600/5"
                    : isLight
                    ? "hover:bg-slate-50"
                    : "hover:bg-white/[0.02]"
                }`}
              >
                {/* Feature Title */}
                <div className="md:col-span-4 p-4 sm:p-6">
                  <span
                    className={`font-bold text-sm ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {row.feature}
                  </span>
                </div>

                {/* Traditional Side */}
                <div
                  className={`md:col-span-4 p-4 sm:p-6 md:border-l border-black/5 dark:border-white/10 flex items-start gap-2.5 ${
                    isLight ? "text-slate-600" : "text-neutral-400"
                  }`}
                >
                  <X className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm font-medium">
                    {row.traditional}
                  </span>
                </div>

                {/* Sonikoma Side */}
                <div
                  className={`md:col-span-4 p-4 sm:p-6 md:border-l border-black/5 dark:border-white/10 flex items-start gap-2.5 ${
                    isLight ? "text-blue-900 font-semibold" : "text-blue-300 font-semibold"
                  }`}
                >
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 font-black" />
                  <span className="text-xs sm:text-sm">
                    {row.sonikoma}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Callout */}
          <div
            className={`p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/5 dark:border-white/10 ${
              isLight ? "bg-slate-50" : "bg-neutral-900/40"
            }`}
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4
                  className={`font-bold text-sm ${
                    isLight ? "text-slate-900" : "text-white"
                  }`}
                >
                  Save 20+ hours per week on comic video production
                </h4>
                <p className="text-xs text-neutral-400">
                  Focus on storytelling and audience growth while AI takes care of the rendering.
                </p>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
