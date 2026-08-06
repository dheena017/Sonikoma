import React, { useState } from "react";
import { DetectedPanel } from "@/features/image_editor/components/shared";
import {
  Layers,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Tag,
  Box,
  Percent,
  Compass,
  FileJson,
  Sparkles,
  Info,
} from "lucide-react";

interface AutoCropPanelDetailsProps {
  panels: DetectedPanel[];
  detectedEngine?: string;
  imageDimensions?: { width: number; height: number };
  onHighlightPanel?: (panel: DetectedPanel | null) => void;
}

export function AutoCropPanelDetails({
  panels,
  detectedEngine = "OpenCV",
  imageDimensions,
  onHighlightPanel,
}: AutoCropPanelDetailsProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [showJson, setShowJson] = useState(false);

  if (!panels || panels.length === 0) {
    return (
      <div className="bg-neutral-950/60 border border-neutral-850 rounded-2xl p-5 text-center space-y-2">
        <Layers className="h-6 w-6 text-neutral-600 mx-auto" />
        <p className="text-xs font-mono text-neutral-400">
          No panel detection results to display yet. Run a preview or detection pass to inspect panel details.
        </p>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(panels, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredPanels = panels.filter((p) => {
    if (filterType === "all") return true;
    if (filterType === "headers") return p.isHeader || p.panelType?.includes("Banner");
    if (filterType === "standard") return !p.isHeader && !p.panelType?.includes("Banner") && !p.panelType?.includes("Splash");
    if (filterType === "splash") return p.panelType?.includes("Splash") || (p.areaPct && p.areaPct > 70);
    return true;
  });

  const totalArea = panels.reduce((acc, p) => acc + (p.area || 0), 0);
  const avgConfidence = Math.round(
    (panels.reduce((acc, p) => acc + (p.confidence || 0.85), 0) / panels.length) * 100
  );

  return (
    <div className="bg-neutral-950/50 border border-neutral-850 rounded-3xl p-4 sm:p-5 space-y-4 backdrop-blur-md shadow-xl">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-mono text-xs font-bold">
            <Layers className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold font-mono text-white uppercase tracking-wider flex items-center gap-2">
              <span>Crop Detection Diagnostics & Detailed Metrics</span>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {panels.length} PANELS DETECTED
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400 font-sans">
              Comprehensive Bounding Box Breakdown • Engine: <strong className="text-white">{detectedEngine}</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowJson(!showJson)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9px] font-mono font-bold transition-all cursor-pointer ${
              showJson
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <FileJson className="h-3 w-3" />
            <span>{showJson ? "Hide Raw JSON" : "Raw JSON"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-[9px] font-mono font-bold transition-all cursor-pointer"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied!" : "Copy JSON"}</span>
          </button>
        </div>
      </div>

      {/* ── Overview Summary Chips ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[9.5px]">
        <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-0.5">
          <span className="text-neutral-500 text-[8px] uppercase tracking-wider block">Total Panels</span>
          <span className="text-white font-bold text-sm">{panels.length} Cutouts</span>
        </div>

        <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-0.5">
          <span className="text-neutral-500 text-[8px] uppercase tracking-wider block">Avg Confidence</span>
          <span className="text-emerald-400 font-bold text-sm">{avgConfidence}% Rating</span>
        </div>

        <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-0.5">
          <span className="text-neutral-500 text-[8px] uppercase tracking-wider block">Target Dimensions</span>
          <span className="text-indigo-300 font-bold text-sm">
            {imageDimensions ? `${imageDimensions.width}×${imageDimensions.height} px` : "Auto Scaled"}
          </span>
        </div>

        <div className="p-2.5 bg-neutral-900/60 border border-neutral-800/80 rounded-xl space-y-0.5">
          <span className="text-neutral-500 text-[8px] uppercase tracking-wider block">Detection Strategy</span>
          <span className="text-cyan-300 font-bold text-sm truncate block">{detectedEngine} Engine</span>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-neutral-850">
        {[
          { id: "all", label: `All Panels (${panels.length})` },
          { id: "headers", label: "Headers & Banners" },
          { id: "standard", label: "Standard Storyboard" },
          { id: "splash", label: "Splash Pages" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-mono font-bold transition-all cursor-pointer whitespace-nowrap ${
              filterType === tab.id
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Raw JSON View Toggle ── */}
      {showJson && (
        <div className="p-3 bg-[#07070b] border border-purple-500/30 rounded-2xl font-mono text-[9px] text-purple-200 overflow-x-auto max-h-48 animate-fadeIn">
          <pre>{JSON.stringify(panels, null, 2)}</pre>
        </div>
      )}

      {/* ── Detailed Panel Cards List ── */}
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {filteredPanels.map((panel, idx) => {
          const isSelected = selectedIdx === idx;
          const displayIdx = panel.index || idx + 1;
          const aspectText = panel.aspectRatioLabel || (panel.aspectRatio ? `${panel.aspectRatio}:1` : "Free");
          const typeText = panel.panelType || (panel.isHeader ? "Wide Banner / Header" : "Standard Storyboard Panel");
          const confidencePct = Math.round((panel.confidence || 0.9) * 100);

          return (
            <div
              key={panel.id || `panel-${idx}`}
              onMouseEnter={() => onHighlightPanel?.(panel)}
              onMouseLeave={() => onHighlightPanel?.(null)}
              onClick={() => setSelectedIdx(isSelected ? null : idx)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-indigo-950/30 border-indigo-500/50 shadow-md shadow-indigo-950/40"
                  : "bg-neutral-900/40 border-neutral-850 hover:bg-neutral-900/80 hover:border-neutral-750"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono text-[9px] font-bold flex items-center justify-center">
                    #{displayIdx}
                  </span>
                  <span className="text-[11px] font-bold text-white font-mono">{typeText}</span>
                  {panel.isHeader && (
                    <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                      HEADER
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-bold">
                    {aspectText}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {confidencePct}% CONFIDENCE
                  </span>
                </div>
              </div>

              {/* Grid Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono text-neutral-400 pt-1 border-t border-neutral-850/60">
                <div>
                  <span className="text-neutral-500 block text-[7.5px] uppercase">Dimensions (Px)</span>
                  <span className="text-white font-bold">
                    {panel.width || "N/A"} × {panel.height || "N/A"} px
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[7.5px] uppercase">Origin Coord (X, Y)</span>
                  <span className="text-white font-bold">
                    X: {panel.x ?? 0}, Y: {panel.y ?? 0}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[7.5px] uppercase">Canvas Area %</span>
                  <span className="text-indigo-300 font-bold">
                    {panel.areaPct ? `${panel.areaPct}%` : panel.area ? `${panel.area} px²` : "N/A"}
                  </span>
                </div>

                <div>
                  <span className="text-neutral-500 block text-[7.5px] uppercase">Crop Bounds %</span>
                  <span className="text-neutral-300 font-bold">
                    T:{panel.cropTop}% B:{panel.cropBottom}% L:{panel.cropLeft}% R:{panel.cropRight}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
