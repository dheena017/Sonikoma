import React, { useState, useEffect } from "react";
import { Split, ChevronUp, ChevronDown, Plus, X, Grid, Hash, Trash2, ArrowUpDown, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { detectHorizontalGutters } from "../utils/gutterScanner";
import HorizontalSplitterPresets from "./HorizontalSplitterPresets";
import HorizontalSplitterControls from "./HorizontalSplitterControls";
import HorizontalSplitterPreview from "./HorizontalSplitterPreview";

interface HorizontalSplitterProps {
  splitPosition: number;
  setSplitPosition: React.Dispatch<React.SetStateAction<number>>;
  splitLines: number[];
  setSplitLines: React.Dispatch<React.SetStateAction<number[]>>;
  showSplitPosition: boolean;
  setShowSplitPosition: (v: boolean) => void;
  setEditCropTop: (val: number) => void;
  setEditCropBottom: (val: number) => void;
  setEditCropLeft: (val: number) => void;
  setEditCropRight: (val: number) => void;
  setSelectedCutId: (id: string | null) => void;
  handleAddSplitLine: () => void;
  handleRemoveSplitLine: (yVal: number) => void;
  handleExecuteHorizontalSplit: () => Promise<void>;
  isSavingEdit: boolean;
  imageUrl?: string | null;
  magneticSnap: boolean;
  setMagneticSnap: (v: boolean) => void;
  detectedGutters: number[];
  setDetectedGutters: (v: number[]) => void;
}

export default function HorizontalSplitter({
  splitPosition,
  setSplitPosition,
  splitLines,
  setSplitLines,
  showSplitPosition,
  setShowSplitPosition,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setSelectedCutId,
  handleAddSplitLine,
  handleRemoveSplitLine,
  handleExecuteHorizontalSplit,
  isSavingEdit,
  imageUrl,
  magneticSnap,
  setMagneticSnap,
  detectedGutters,
  setDetectedGutters,
}: HorizontalSplitterProps) {
  const [equalPartsCount, setEqualPartsCount] = useState<number>(3);
  const [intervalPercent, setIntervalPercent] = useState<number>(20);
  const [cutHeightPx, setCutHeightPx] = useState<number>(1000);
  const [tolerance, setTolerance] = useState<number>(15);
  const [minGutterHeight, setMinGutterHeight] = useState<number>(2);

  // Bulk shift state
  const [bulkShiftVal, setBulkShiftVal] = useState<number>(5);
  const [bulkShiftUnit, setBulkShiftUnit] = useState<"pct" | "px">("pct");

  // Natural Image Dimensions State
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);

  // Layout Templates State
  const [savedTemplates, setSavedTemplates] = useState<Record<string, number[]>>(() => {
    try {
      const item = localStorage.getItem("splitter_templates");
      return item ? JSON.parse(item) : {
        "Preset: 3 Equal Parts": [33.3, 66.7],
        "Preset: 4 Equal Parts": [25, 50, 75],
      };
    } catch {
      return {
        "Preset: 3 Equal Parts": [33.3, 66.7],
        "Preset: 4 Equal Parts": [25, 50, 75],
      };
    }
  });
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    if (!imageUrl) return;
    detectHorizontalGutters(imageUrl, tolerance, minGutterHeight)
      .then(({ gutters, naturalWidth, naturalHeight }) => {
        setNaturalWidth(naturalWidth);
        setNaturalHeight(naturalHeight);
        setDetectedGutters(gutters);
      })
      .catch((err) => {
        console.warn("Gutter detection error:", err);
      });
  }, [imageUrl, setDetectedGutters, tolerance, minGutterHeight]);

  const sliderPct = ((splitPosition - 5) / 90) * 100;

  const getSnappedValue = (val: number): number => {
    if (!magneticSnap || detectedGutters.length === 0) return val;
    let nearest = val;
    let minDiff = 2.0;
    for (const g of detectedGutters) {
      const diff = Math.abs(g - val);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = g;
      }
    }
    return nearest;
  };

  const handleSetSplitPosition = (val: number) => {
    const snapped = getSnappedValue(val);
    setSplitPosition(parseFloat(snapped.toFixed(1)));
  };

  const handleGenerateEqualSplits = (parts: number) => {
    if (parts < 2) return;
    const newLines: number[] = [];
    const step = 100 / parts;
    for (let i = 1; i < parts; i++) {
      const val = parseFloat((i * step).toFixed(1));
      if (val >= 5 && val <= 95) {
        newLines.push(val);
      }
    }
    setSplitLines(newLines.sort((a, b) => a - b));
    setShowSplitPosition(true);
  };

  const handleGenerateIntervalSplits = (interval: number) => {
    if (interval <= 0 || interval >= 100) return;
    const newLines: number[] = [];
    for (let val = interval; val < 100; val += interval) {
      const rounded = parseFloat(val.toFixed(1));
      if (rounded >= 5 && rounded <= 95) {
        newLines.push(rounded);
      }
    }
    setSplitLines(newLines.sort((a, b) => a - b));
    setShowSplitPosition(true);
  };

  const handleApplyPixelCut = () => {
    if (!naturalHeight || cutHeightPx <= 0) return;
    const newLines: number[] = [];
    for (let currentY = cutHeightPx; currentY < naturalHeight; currentY += cutHeightPx) {
      const pct = parseFloat(((currentY / naturalHeight) * 100).toFixed(1));
      if (pct >= 5 && pct <= 95) {
        newLines.push(pct);
      }
    }
    setSplitLines(newLines.sort((a, b) => a - b));
    setShowSplitPosition(true);
  };

  const handleUpdateSplitLine = (idx: number, newY: number) => {
    const rounded = parseFloat(Math.max(5, Math.min(95, newY)).toFixed(1));
    setSplitLines((prev) => {
      const copy = [...prev];
      copy[idx] = rounded;
      return copy;
    });
  };

  const handleSortSplitLines = () => {
    setSplitLines((prev) => [...prev].sort((a, b) => a - b));
  };

  const handleAutoPlaceCuts = () => {
    if (detectedGutters.length === 0) return;
    setSplitLines([...detectedGutters].sort((a, b) => a - b));
    setShowSplitPosition(true);
  };

  const handleBulkShiftLines = (direction: "up" | "down") => {
    let pctAmount = bulkShiftVal;
    if (bulkShiftUnit === "px" && naturalHeight) {
      pctAmount = (bulkShiftVal / naturalHeight) * 100;
    }

    const shift = direction === "up" ? -pctAmount : pctAmount;

    setSplitLines((prev) => {
      const shifted = prev.map((y) => {
        const newY = parseFloat((y + shift).toFixed(1));
        return Math.max(5, Math.min(95, newY));
      });
      return Array.from(new Set(shifted)).sort((a: number, b: number) => a - b);
    });
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || splitLines.length === 0) return;
    const name = newTemplateName.trim();
    const updated = {
      ...savedTemplates,
      [name]: [...splitLines].sort((a, b) => a - b),
    };
    setSavedTemplates(updated);
    localStorage.setItem("splitter_templates", JSON.stringify(updated));
    setNewTemplateName("");
    setSelectedTemplate(name);
  };

  const handleLoadTemplate = (name: string) => {
    if (!name || !savedTemplates[name]) return;
    setSplitLines([...savedTemplates[name]]);
    setShowSplitPosition(true);
    setSelectedTemplate(name);
  };

  const handleDeleteTemplate = (name: string) => {
    const copy = { ...savedTemplates };
    delete copy[name];
    setSavedTemplates(copy);
    localStorage.setItem("splitter_templates", JSON.stringify(copy));
    if (selectedTemplate === name) {
      setSelectedTemplate("");
    }
  };

  const getResultingSegments = () => {
    const sorted = [...splitLines].sort((a, b) => a - b);
    const segments = [];
    let prevPct = 0;

    for (let i = 0; i <= sorted.length; i++) {
      const currentPct = i < sorted.length ? sorted[i] : 100;
      const heightPct = currentPct - prevPct;

      const startPx = naturalHeight ? Math.round((prevPct / 100) * naturalHeight) : 0;
      const endPx = naturalHeight ? Math.round((currentPct / 100) * naturalHeight) : 0;
      const heightPx = naturalHeight ? endPx - startPx : null;

      segments.push({
        index: i + 1,
        startPct: prevPct,
        endPct: currentPct,
        heightPct: parseFloat(heightPct.toFixed(1)),
        heightPx,
      });
      prevPct = currentPct;
    }
    return segments;
  };

  const resultingSegments = getResultingSegments();

  return (
    <div className="space-y-4 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-indigo-500/10 border border-indigo-500/15">
            <Split className="h-3 w-3 text-indigo-400 rotate-90" />
          </div>
          <span className="text-[10px] uppercase font-mono font-bold text-neutral-400 tracking-widest">
            Horizontal Cutter
          </span>
        </div>
        <label className="relative flex items-center gap-2 cursor-pointer select-none text-[10px] text-neutral-500 hover:text-neutral-300 transition-colors">
          <span>Guideline</span>
          <div className={`relative w-8 h-4 rounded-full border transition-all ${showSplitPosition ? "bg-purple-600 border-purple-500" : "bg-neutral-800 border-neutral-700"}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-all ${showSplitPosition ? "left-4.5" : "left-0.5"}`} />
            <input
              type="checkbox"
              checked={showSplitPosition}
              onChange={(e) => {
                setShowSplitPosition(e.target.checked);
                if (e.target.checked) {
                  setEditCropTop(0);
                  setEditCropBottom(0);
                  setEditCropLeft(0);
                  setEditCropRight(0);
                  setSelectedCutId(null);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </label>
      </div>

      {/* Natural Dimension Badge */}
      {naturalHeight && naturalWidth && (
        <div className="bg-purple-500/15 border border-purple-500/20 rounded-xl px-3 py-1.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-3.5 w-3.5 text-purple-400" />
            <div className="text-[10px] font-mono text-purple-300">
              Image size: <span className="font-bold">{naturalWidth}px</span> &times; <span className="font-bold">{naturalHeight}px</span>
            </div>
          </div>
          {detectedGutters.length > 0 && (
            <span className="text-[8px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-md font-bold font-mono">
              ⚡ {detectedGutters.length} Gaps
            </span>
          )}
        </div>
      )}

      {/* Gutter Detection Tuning Controls */}
      <div className="bg-neutral-900/60 border border-white/5 p-3 rounded-xl space-y-3">
        <div className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-widest flex items-center justify-between">
          <span>Gutter Gap Tuning</span>
          <span className="text-[8px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
            {detectedGutters.length} gaps found
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Tolerance */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>Color Tolerance</span>
              <span className="text-purple-300 font-bold">{tolerance}</span>
            </div>
            <input
              type="range"
              min="2"
              max="60"
              value={tolerance}
              onChange={(e) => setTolerance(Number(e.target.value))}
              className="w-full accent-purple-500 bg-neutral-800 rounded-full h-1 cursor-pointer"
              title="Sensitivity of background gutter color match"
            />
          </div>

          {/* Min Gutter Height */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>Min Gap Height</span>
              <span className="text-purple-300 font-bold">{minGutterHeight}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={minGutterHeight}
              onChange={(e) => setMinGutterHeight(Number(e.target.value))}
              className="w-full accent-purple-500 bg-neutral-800 rounded-full h-1 cursor-pointer"
              title="Minimum height of whitespace strip to consider a gutter"
            />
          </div>
        </div>
      </div>

      {/* Smart Gutter Snap Actions / Nudge guideline controls */}
      <HorizontalSplitterControls
        splitPosition={splitPosition}
        handleSetSplitPosition={handleSetSplitPosition}
        setShowSplitPosition={setShowSplitPosition}
        detectedGutters={detectedGutters}
        magneticSnap={magneticSnap}
        setMagneticSnap={setMagneticSnap}
        handleAutoPlaceCuts={handleAutoPlaceCuts}
        handleAddSplitLine={handleAddSplitLine}
        sliderPct={sliderPct}
      />

      {/* Generator Tools */}
      <div className="space-y-3 bg-black/30 p-3 rounded-xl border border-white/5">
        <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 flex items-center gap-1.5">
          <Grid className="h-3 w-3 text-indigo-400" />
          <span>Generator Tools</span>
        </div>

        {/* N-Equal parts divider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
            <span>Divide into Equal Parts</span>
            <span className="text-indigo-300 font-bold">{equalPartsCount} parts</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="2"
              max="15"
              value={equalPartsCount}
              onChange={(e) => setEqualPartsCount(Math.max(2, Math.min(15, parseInt(e.target.value) || 2)))}
              className="w-12 text-center text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 text-white focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleGenerateEqualSplits(equalPartsCount)}
              className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold py-1 rounded-lg cursor-pointer transition-all"
            >
              Generate Equal Splits
            </button>
          </div>
        </div>

        {/* Quick Presets row */}
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-neutral-600">Presets:</span>
          <button
            type="button"
            onClick={() => handleGenerateEqualSplits(2)}
            className="px-2 py-0.5 bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-neutral-400 hover:text-white rounded text-[9px] font-mono transition-all cursor-pointer"
          >
            2 Parts (50%)
          </button>
          <button
            type="button"
            onClick={() => handleGenerateEqualSplits(3)}
            className="px-2 py-0.5 bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-neutral-400 hover:text-white rounded text-[9px] font-mono transition-all cursor-pointer"
          >
            3 Parts
          </button>
          <button
            type="button"
            onClick={() => handleGenerateEqualSplits(4)}
            className="px-2 py-0.5 bg-neutral-900 border border-white/5 hover:border-purple-500/30 text-neutral-400 hover:text-white rounded text-[9px] font-mono transition-all cursor-pointer"
          >
            4 Parts
          </button>
        </div>

        {/* Pixel height cutting (Webtoon special) */}
        {naturalHeight && (
          <div className="space-y-1.5 pt-1.5 border-t border-white/5">
            <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
              <span>Cut every X pixels</span>
              <span className="text-purple-300 font-bold">{cutHeightPx} px</span>
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="100"
                max={naturalHeight}
                step="50"
                value={cutHeightPx}
                onChange={(e) => setCutHeightPx(Math.max(100, Math.min(naturalHeight, parseInt(e.target.value) || 500)))}
                className="flex-1 text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 px-2 text-white focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyPixelCut}
                className="bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[10px] font-bold py-1 px-4 rounded-lg cursor-pointer transition-all"
              >
                Apply Pixel Cut
              </button>
            </div>
          </div>
        )}

        {/* Repeating Intervals divider */}
        <div className="space-y-1.5 pt-1.5 border-t border-white/5">
          <div className="flex justify-between items-center text-[9px] font-mono text-neutral-500">
            <span>Repeating Interval Cuts</span>
            <span className="text-indigo-300 font-bold">Every {intervalPercent}%</span>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={intervalPercent}
              onChange={(e) => setIntervalPercent(parseFloat(e.target.value))}
              className="flex-1 text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 px-2 text-white focus:outline-none"
            >
              <option value="10">Every 10% (9 cuts)</option>
              <option value="15">Every 15% (6 cuts)</option>
              <option value="20">Every 20% (4 cuts)</option>
              <option value="25">Every 25% (3 cuts)</option>
              <option value="30">Every 30% (3 cuts)</option>
              <option value="33.3">Every 33.3% (2 cuts)</option>
              <option value="50">Every 50% (1 cut)</option>
            </select>
            <button
              type="button"
              onClick={() => handleGenerateIntervalSplits(intervalPercent)}
              className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 text-[10px] font-bold py-1 px-3 rounded-lg cursor-pointer transition-all"
            >
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Shift Tool */}
      {splitLines.length > 0 && (
        <div className="space-y-2 bg-black/30 p-3 rounded-xl border border-white/5">
          <div className="text-[10px] uppercase font-mono font-bold text-neutral-400 flex items-center justify-between">
            <span>Bulk Shift Guidelines</span>
            <span className="text-neutral-500 text-[9px] font-mono">Shift All</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              value={bulkShiftVal}
              onChange={(e) => setBulkShiftVal(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-12 text-center text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 text-white focus:outline-none"
            />
            <select
              value={bulkShiftUnit}
              onChange={(e) => setBulkShiftUnit(e.target.value as any)}
              className="text-[10px] font-bold font-mono bg-neutral-900 border border-white/10 rounded-lg py-1 px-1.5 text-white focus:outline-none"
            >
              <option value="pct">%</option>
              {naturalHeight && <option value="px">px</option>}
            </select>

            <div className="flex flex-1 gap-1">
              <button
                type="button"
                onClick={() => handleBulkShiftLines("up")}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[9px] py-1 rounded-lg transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                title="Shift All Lines Up"
              >
                <ArrowUp className="h-3 w-3 text-purple-400" />
                <span>Up</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkShiftLines("down")}
                className="flex-1 bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-300 text-[9px] py-1 rounded-lg transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                title="Shift All Lines Down"
              >
                <ArrowDown className="h-3 w-3 text-purple-400" />
                <span>Down</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Manager */}
      <HorizontalSplitterPresets
        savedTemplates={savedTemplates}
        selectedTemplate={selectedTemplate}
        handleLoadTemplate={handleLoadTemplate}
        handleDeleteTemplate={handleDeleteTemplate}
        newTemplateName={newTemplateName}
        setNewTemplateName={setNewTemplateName}
        handleSaveTemplate={handleSaveTemplate}
        splitLines={splitLines}
      />

      {/* Defined split lines list */}
      {splitLines.length > 0 && (
        <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1.5">
          <div className="flex justify-between items-center text-[9px] uppercase font-mono text-neutral-600 pb-1 border-b border-white/5">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3 text-indigo-400/70" />
              <span>Defined Lines ({splitLines.length})</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSortSplitLines}
                className="text-neutral-500 hover:text-neutral-300 font-mono text-[9px] flex items-center gap-0.5 cursor-pointer transition-colors"
                title="Sort lines in order"
              >
                <ArrowUpDown className="h-2.5 w-2.5" />
                <span>Sort</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitLines([])}
                className="text-red-500/70 hover:text-red-400 font-mono text-[9px] flex items-center gap-0.5 cursor-pointer transition-colors"
                title="Clear all lines"
              >
                <Trash2 className="h-2.5 w-2.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
            {splitLines.map((y, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center text-[10px] text-neutral-400 font-mono bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.03] rounded-lg px-2 py-1 group"
              >
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSplitPosition(y);
                      setShowSplitPosition(true);
                    }}
                    className="w-4 h-4 rounded bg-purple-900/30 text-purple-400 hover:bg-purple-900/50 hover:text-white flex items-center justify-center text-[8px] font-bold transition-all cursor-pointer"
                    title="Focus Guideline Here"
                  >
                    {idx + 1}
                  </button>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="5"
                      max="95"
                      step="0.1"
                      value={y}
                      onChange={(e) => {
                        let val = parseFloat(e.target.value);
                        if (isNaN(val)) return;
                        handleUpdateSplitLine(idx, val);
                      }}
                      className="bg-transparent text-purple-400 font-bold font-mono text-[10px] w-12 focus:outline-none focus:bg-black/50 rounded px-1 text-center"
                    />
                    <span>%</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveSplitLine(y)}
                  className="text-neutral-700 hover:text-red-400 cursor-pointer transition-colors p-0.5 rounded"
                  title="Remove Line"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resulting Segments Height Breakdown */}
      <HorizontalSplitterPreview resultingSegments={resultingSegments} />

      {/* Main split execution button */}
      <button
        type="button"
        onClick={handleExecuteHorizontalSplit}
        disabled={isSavingEdit}
        className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-bold py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/30"
        style={{ boxShadow: isSavingEdit ? undefined : "0 0 15px rgba(139,92,246,0.2)" }}
      >
        <Split className="h-3.5 w-3.5 rotate-90" />
        <span>
          {splitLines.length > 0
            ? `Split Panel into ${splitLines.length + 1} Parts`
            : "Split Panel in Two"}
        </span>
      </button>
    </div>
  );
}
