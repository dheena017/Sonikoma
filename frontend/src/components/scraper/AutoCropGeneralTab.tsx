/**
 * AutoCropGeneralTab — Engine selector, built-in presets, auto-split toggle,
 * and custom profile save/load slots.
 */
import React, { useState } from "react";
import { Sparkles, Cpu, Settings, Save, RefreshCw, ChevronDown } from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { AutoCropSharedProps, CustomCropPreset } from "./tabTypes";

interface AutoCropGeneralTabProps extends AutoCropSharedProps {}

export function AutoCropGeneralTab({
  useLocalCV,
  setUseLocalCV,
  cropModel,
  setCropModel,
  autoSplitTallStrips,
  setAutoSplitTallStrips,
  cropSensitivity,
  setCropSensitivity,
  cropPaddingPx,
  setCropPaddingPx,
  cropBackgroundMode,
  setCropBackgroundMode,
  aspectRatioLock,
  setAspectRatioLock,
  minPanelAreaPct,
  setMinPanelAreaPct,
  overlapMergeThreshold,
  setOverlapMergeThreshold,
  cropMinHeightPx,
  setCropMinHeightPx,
  cropCannyLow,
  setCropCannyLow,
  cropCannyHigh,
  setCropCannyHigh,
  cropCloseKernelSize,
  setCropCloseKernelSize,
  addNotification,
}: AutoCropGeneralTabProps) {
  const [customPresets, setCustomPresets] = useState<Record<string, CustomCropPreset>>(() => {
    try {
      const saved = localStorage.getItem("crop_custom_presets");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    const defaults: CustomCropPreset = {
      name: "Custom Slot",
      useLocalCV: true,
      cropModel: "gemini-2.5-flash",
      autoSplitTallStrips: true,
      cropSensitivity: 30,
      cropPaddingPx: 10,
      cropBackgroundMode: "auto",
      aspectRatioLock: "free",
      minPanelAreaPct: 2.0,
      overlapMergeThreshold: 20,
      cropMinHeightPx: 60,
      cropCannyLow: 20,
      cropCannyHigh: 100,
      cropCloseKernelSize: 15,
    };
    return {
      slot1: { ...defaults, name: "Custom Slot 1" },
      slot2: { ...defaults, name: "Custom Slot 2" },
      slot3: { ...defaults, name: "Custom Slot 3" },
    };
  });

  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [slotNames, setSlotNames] = useState<Record<string, string>>({
    slot1: customPresets.slot1.name,
    slot2: customPresets.slot2.name,
    slot3: customPresets.slot3.name,
  });

  const savePresetSlot = (slot: string) => {
    const updated = {
      ...customPresets,
      [slot]: {
        name: slotNames[slot].trim() || `Custom ${slot.toUpperCase()}`,
        useLocalCV, cropModel, autoSplitTallStrips, cropSensitivity,
        cropPaddingPx, cropBackgroundMode, aspectRatioLock, minPanelAreaPct,
        overlapMergeThreshold, cropMinHeightPx, cropCannyLow, cropCannyHigh, cropCloseKernelSize,
      },
    };
    setCustomPresets(updated);
    localStorage.setItem("crop_custom_presets", JSON.stringify(updated));
    setActiveSlot(slot);
    addNotification?.(`Saved configuration to preset: "${updated[slot].name}"`, "success");
  };

  const loadPresetSlot = (slot: string) => {
    const t = customPresets[slot];
    if (!t) return;
    setUseLocalCV(t.useLocalCV);
    setCropModel(t.cropModel);
    setAutoSplitTallStrips(t.autoSplitTallStrips);
    setCropSensitivity(t.cropSensitivity);
    setCropPaddingPx(t.cropPaddingPx);
    setCropBackgroundMode(t.cropBackgroundMode);
    setAspectRatioLock(t.aspectRatioLock);
    setMinPanelAreaPct(t.minPanelAreaPct);
    setOverlapMergeThreshold(t.overlapMergeThreshold);
    setCropMinHeightPx(t.cropMinHeightPx);
    setCropCannyLow(t.cropCannyLow);
    setCropCannyHigh(t.cropCannyHigh);
    setCropCloseKernelSize(t.cropCloseKernelSize);
    setActiveSlot(slot);
    addNotification?.(`Loaded preset config: "${t.name}"`, "info");
  };

  const border = (slot: string, active: string) =>
    activeSlot === slot
      ? `border-${active}-500 shadow-[0_0_12px_rgba(16,185,129,0.12)]`
      : "border-neutral-800 hover:border-neutral-700";

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Built-in Crop Profile Presets */}
      <div className="space-y-3">
        <SectionTitle icon={<Sparkles className="h-3 w-3" />}>Crop Profile Presets</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => { setCropSensitivity(30); setCropPaddingPx(10); setCropBackgroundMode("auto"); setAspectRatioLock("free"); setAutoSplitTallStrips(true); setMinPanelAreaPct(1.5); setOverlapMergeThreshold(30); setActiveSlot("standard"); }}
            className={`bg-neutral-950/40 border px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${border("standard", "emerald")}`}>
            <span className="text-[11px] font-bold text-white block">⚖️ Standard Balanced</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">30% sens · 10px pad · Auto BG</span>
          </button>
          <button type="button" onClick={() => { setCropSensitivity(25); setCropPaddingPx(15); setCropBackgroundMode("auto"); setAspectRatioLock("free"); setAutoSplitTallStrips(true); setMinPanelAreaPct(1.0); setOverlapMergeThreshold(45); setActiveSlot("webtoon"); }}
            className={`bg-neutral-950/40 border px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${border("webtoon", "emerald")}`}>
            <span className="text-[11px] font-bold text-white block">⚡ Webtoon Strip Slicer</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">25% sens · 15px pad · Fast split</span>
          </button>
          <button type="button" onClick={() => { setCropSensitivity(45); setCropPaddingPx(5); setCropBackgroundMode("white"); setAspectRatioLock("free"); setAutoSplitTallStrips(false); setMinPanelAreaPct(2.0); setOverlapMergeThreshold(20); setActiveSlot("manga"); }}
            className={`bg-neutral-950/40 border px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${border("manga", "emerald")}`}>
            <span className="text-[11px] font-bold text-white block">📖 Precise Manga</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">45% sens · 5px pad · White BG</span>
          </button>
          <button type="button" onClick={() => { setCropSensitivity(30); setCropPaddingPx(12); setCropBackgroundMode("auto"); setAspectRatioLock("1:1"); setAutoSplitTallStrips(true); setMinPanelAreaPct(1.5); setOverlapMergeThreshold(35); setActiveSlot("square"); }}
            className={`bg-neutral-950/40 border px-4 py-3.5 rounded-2xl text-left transition-all cursor-pointer ${border("square", "emerald")}`}>
            <span className="text-[11px] font-bold text-white block">🏁 Mobile Square (1:1)</span>
            <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">30% sens · 12px pad · Square lock</span>
          </button>
        </div>
      </div>

      {/* Engine selection */}
      <div className="space-y-3">
        <SectionTitle icon={<Cpu className="h-3 w-3" />}>Panel Detection Engine</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={() => setUseLocalCV(true)}
            className={`flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${useLocalCV ? "bg-cyan-950/20 border-cyan-500 shadow-[0_0_14px_rgba(6,182,212,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"}`}>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white">OPENCV ONLY</span>
              <span className={`h-2.5 w-2.5 rounded-full ${useLocalCV ? "bg-cyan-400" : "bg-neutral-800"}`} />
            </div>
            <p className="text-[10px] text-neutral-400 leading-normal font-sans">Server-side Python OpenCV edge finder. Uses canny filtering for rapid page gutter cutting. Offline capable and reliable.</p>
          </button>
          <button type="button" onClick={() => setUseLocalCV(false)}
            className={`flex flex-col gap-2 p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${!useLocalCV ? "bg-indigo-950/20 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.15)]" : "bg-neutral-950/40 border-neutral-800 hover:border-neutral-700"}`}>
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white">GEMINI VISION AI</span>
              <span className={`h-2.5 w-2.5 rounded-full ${!useLocalCV ? "bg-indigo-400 animate-pulse" : "bg-neutral-800"}`} />
            </div>
            <p className="text-[10px] text-neutral-400 leading-normal font-sans">AI visual panel layout segmenter. Understands illustration boxes semantically even on complex overlap gutters.</p>
          </button>
        </div>
      </div>

      {/* Gemini model selector */}
      {!useLocalCV && (
        <div className="space-y-2.5 p-4 bg-neutral-950/50 border border-neutral-800 rounded-2xl">
          <label className="text-[9px] font-bold text-neutral-500 uppercase font-mono block tracking-wider">Gemini Vision Model</label>
          <div className="relative">
            <select value={cropModel} onChange={(e) => setCropModel(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl px-3.5 py-2 text-[10px] font-mono focus:border-indigo-500/50 focus:outline-none cursor-pointer appearance-none transition-colors hover:border-neutral-700">
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast, Visual Layout)</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep Visual Comprehension)</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Auto-Split switch */}
      <label className="relative flex items-center gap-3 bg-neutral-950/40 border border-neutral-800 rounded-2xl px-5 py-4 cursor-pointer hover:bg-neutral-900 transition-all select-none">
        <input type="checkbox" checked={autoSplitTallStrips} onChange={(e) => setAutoSplitTallStrips(e.target.checked)} className="accent-indigo-500 h-4.5 w-4.5 rounded cursor-pointer" />
        <div className="flex flex-col">
          <span className="text-[12px] font-bold text-white">Auto-Split Strips</span>
          <span className="text-[9px] text-neutral-500 mt-0.5 leading-normal">Automatically detects vertical seams to split tall webtoon strip pages into standalone scenes.</span>
        </div>
      </label>

      {/* Custom Profile Slots */}
      <div className="space-y-3 pt-2">
        <SectionTitle icon={<Settings className="h-3 w-3" />}>Custom Profile Slots</SectionTitle>
        <div className="space-y-2">
          {["slot1", "slot2", "slot3"].map((slot) => (
            <div key={slot} className="flex items-center gap-2 p-3 bg-neutral-900/30 border border-neutral-800 rounded-xl hover:bg-neutral-900/60 transition-colors">
              <input
                type="text"
                value={slotNames[slot]}
                onChange={(e) => setSlotNames({ ...slotNames, [slot]: e.target.value })}
                placeholder="Custom Slot name..."
                className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex-1 focus:border-emerald-500/50 focus:outline-none"
              />
              <button type="button" onClick={() => savePresetSlot(slot)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-950 bg-emerald-950/20 hover:bg-emerald-500/10 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-400 hover:text-emerald-300 transition-all active:scale-95 cursor-pointer">
                <Save className="h-3 w-3" /> Save
              </button>
              <button type="button" onClick={() => loadPresetSlot(slot)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer">
                <RefreshCw className="h-3 w-3" /> Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
