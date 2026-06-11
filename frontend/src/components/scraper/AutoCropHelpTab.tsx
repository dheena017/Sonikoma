/**
 * AutoCropHelpTab — Parameter guide cards and pro-tip banner.
 */
import React from "react";
import { HelpCircle, Info } from "lucide-react";

export function AutoCropHelpTab() {
  const cards = [
    {
      title: "🔮 Gemini AI vs Local OpenCV",
      body: "Use Gemini AI for complex layouts where character drawings burst out of panels or cross gutters. Use Local CV for standard manga grids or clean webtoon vertical spacing (runs instantly on your system).",
    },
    {
      title: "⚡ Edge Sensitivity",
      body: "Sets the threshold difference to differentiate panels from spacing margins. If white space isn't getting trimmed, increase the sensitivity.",
    },
    {
      title: "📐 Aspect Ratio Lock",
      body: "Adds vertical or horizontal gutter padding borders around cropped boxes to force them to match screen dimensions like 16:9 or 9:16 cleanly.",
    },
    {
      title: "🧱 Morphological Closure",
      body: "Merges lines closer together. If a sketch background outline has tiny open gaps, raising this size fills the gap to create a unified box.",
    },
  ];

  return (
    <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl space-y-4.5">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <HelpCircle className="h-4.5 w-4.5" />
          <h3 className="font-bold font-mono text-xs uppercase tracking-wider">Crop Parameter Guide</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] leading-relaxed">
          {cards.map((card) => (
            <div key={card.title} className="p-3 bg-neutral-900/30 border border-neutral-800 rounded-xl space-y-1">
              <span className="font-mono font-bold text-white block">{card.title}</span>
              <p className="text-neutral-500 font-sans">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="p-3 bg-indigo-950/10 border border-indigo-950/40 text-neutral-400 rounded-xl flex gap-3 text-[10px] items-start">
          <Info className="h-4.5 w-4.5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="space-y-1 font-sans">
            <span className="font-mono font-bold text-indigo-300 uppercase block text-[9px]">Pro-Tip: Slicing Webtoons</span>
            <p>
              To slice long webtoon strips, keep <strong>Auto-Split Strips</strong> enabled, set background mode to <strong>Auto</strong>, padding to <strong>10-15px</strong>, and lock ratio to <strong>9:16 (Mobile Portrait)</strong> to fit mobile screens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
