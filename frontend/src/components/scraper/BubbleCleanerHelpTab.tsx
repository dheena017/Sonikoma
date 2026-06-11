import React from "react";
import { HelpCircle, Layers } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { LEGEND } from "./bubbleCleanerConfig";
import { BubbleCleanerSandbox } from "./BubbleCleanerSandbox";
import { BubbleCleanerDiagnosticDashboard } from "./BubbleCleanerDiagnosticDashboard";

interface Props {
  eraseMethod: string;
  bubbleDilation: number;
  bubbleInpaintRadius: number;
  addNotification?: (msg: string, type: any) => void;
  scrapedImages: string[];
  selectedScraped: string[];
}

export function BubbleCleanerHelpTab({
  eraseMethod, bubbleDilation, bubbleInpaintRadius, addNotification,
  scrapedImages, selectedScraped
}: Props) {
  const dilR = Math.max(22, 20 + (bubbleDilation === -1 ? 4 : bubbleDilation) * 1.2);
  const inpR = Math.max(24, dilR + bubbleInpaintRadius * 1.5);

  const firstImageUrl = selectedScraped.length > 0 ? selectedScraped[0] : scrapedImages.length > 0 ? scrapedImages[0] : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.2s_ease-out]">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-5">
          {/* Parameter manual */}
          <div className="bg-neutral-950/40 border border-neutral-800 p-5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-purple-400">
              <HelpCircle className="h-4.5 w-4.5" />
              <h3 className="font-bold font-mono text-xs uppercase tracking-wider">Bubble Parameter Manual</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[9.5px] leading-relaxed">
              {[
                { title: "🔮 Detection Styles", body: "Use All Bubbles to clean narration cards and standard circles. Use White only if you just want white dialogue spheres without touching caption backgrounds." },
                { title: "🧱 Mask Dilation", body: "Extends boundaries slightly outwards. Prevents dark border ghosts from smudging backgrounds in the inpainter output." },
                { title: "🌫️ Gaussian blur vs inpaint", body: "Gaussian blur completely hides text inside colored blocks while preserving gradient colors. TELEA inpainting reconstructs drawing textures beneath clean white bubbles." },
                { title: "🎨 Custom Color filters", body: "Helpful if a webtoon uses colored thought bubbles (e.g. yellow or blue dialogue text panels) by target-masking that exact hex range." },
              ].map(({ title, body }) => (
                <div key={title} className="p-3.5 bg-neutral-900/30 border border-neutral-800 rounded-2xl space-y-1">
                  <span className="font-mono font-bold text-white block">{title}</span>
                  <p className="text-neutral-500 font-sans">{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bubble type legend */}
          <div className="space-y-3">
            <SectionTitle icon={<Layers className="h-3 w-3 text-purple-400" />}>Bubble Type Legend</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {LEGEND.map((item) => (
                <div key={item.label} className="flex items-start gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-4 py-3">
                  <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.color}`} />
                  <div>
                    <p className="text-[10px] font-bold text-neutral-200 font-mono">{item.label}</p>
                    <p className="text-[9px] text-neutral-500 font-sans mt-0.5 leading-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-5">
          {/* Concentric magnifier */}
          <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
            <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono">Magnifier Mask Visualizer</span>
            <div className="relative w-full max-w-[200px] aspect-square rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center">
              <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#262626" strokeWidth="0.5" />
                <circle cx="50" cy="50" r="20" fill="none" stroke="#a855f7" strokeWidth="1.5" />
                <circle cx="50" cy="50" r={dilR} fill="none" stroke="#ec4899" strokeWidth="1" strokeDasharray="3,3" />
                <circle cx="50" cy="50" r={inpR} fill="none" stroke="#6366f1" strokeWidth="0.8" strokeDasharray="5,2" />
              </svg>
              <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[7px] font-mono text-neutral-600 bg-neutral-900/60 p-1.5 rounded-lg border border-neutral-900">
                <span className="text-purple-400">Core</span>
                <span className="text-pink-400">Dilation</span>
                <span className="text-indigo-400">Inpaint Radius</span>
              </div>
            </div>
            <span className="text-[8px] text-neutral-600 font-mono text-center">SVG rings reflect stroke protection & bleed boundaries.</span>
          </div>

          <BubbleCleanerSandbox
            eraseMethod={eraseMethod}
            addNotification={addNotification}
            firstImageUrl={firstImageUrl}
          />
        </div>
      </div>

      <BubbleCleanerDiagnosticDashboard addNotification={addNotification} />
    </div>
  );
}
