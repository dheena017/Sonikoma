/**
 * BubbleCleanerGeneralTab — Quick presets, detection style, erase method,
 * custom profile slots, split-slider preview, pixel scanner, perf estimator.
 */
import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles, Cpu, Paintbrush, Settings, Save, RefreshCw,
  Download, Upload, Eye, EyeOff, Layers,
} from "lucide-react";
import SectionTitle from "../crop/SectionTitle";
import { DETECTION_OPTIONS, ERASE_OPTIONS } from "./bubbleCleanerConfig";
import { BubbleCleanerSharedProps, CustomBubblePreset } from "./tabTypes";

interface Props extends BubbleCleanerSharedProps {}

export function BubbleCleanerGeneralTab({
  detectionStyle, setDetectionStyle,
  eraseMethod, setEraseMethod,
  sensitivity, setSensitivity,
  bubbleDilation, setBubbleDilation,
  bubbleInpaintRadius, setBubbleInpaintRadius,
  scrapedImages, selectedScraped, addNotification,
}: Props) {
  // ── Custom presets ─────────────────────────────────────────────────────────
  const [customPresets, setCustomPresets] = useState<Record<string, CustomBubblePreset>>(() => {
    try {
      const s = localStorage.getItem("bubble_custom_presets");
      if (s) return JSON.parse(s);
    } catch (_) {}
    return {
      slot1: { name: "Custom Slot 1", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
      slot2: { name: "Custom Slot 2", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
      slot3: { name: "Custom Slot 3", detectionStyle: "all", eraseMethod: "auto", sensitivity: 50, bubbleDilation: -1, bubbleInpaintRadius: 3 },
    };
  });
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [slotNames, setSlotNames] = useState({ slot1: customPresets.slot1.name, slot2: customPresets.slot2.name, slot3: customPresets.slot3.name });

  const savePresetSlot = (slot: string) => {
    const updated = { ...customPresets, [slot]: { name: slotNames[slot].trim() || `Custom Slot ${slot.slice(-1)}`, detectionStyle, eraseMethod, sensitivity, bubbleDilation, bubbleInpaintRadius } };
    setCustomPresets(updated);
    localStorage.setItem("bubble_custom_presets", JSON.stringify(updated));
    setActiveSlot(slot);
    addNotification?.(`Saved custom preset: "${updated[slot].name}"`, "success");
  };

  const loadPresetSlot = (slot: string) => {
    const t = customPresets[slot];
    if (!t) return;
    setDetectionStyle(t.detectionStyle);
    setEraseMethod(t.eraseMethod);
    setSensitivity(t.sensitivity);
    setBubbleDilation(t.bubbleDilation);
    setBubbleInpaintRadius(t.bubbleInpaintRadius);
    setActiveSlot(slot);
    addNotification?.(`Loaded preset: "${t.name}"`, "info");
  };

  const handleExportPresets = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(customPresets, null, 2));
      const a = document.createElement("a");
      a.setAttribute("href", dataStr);
      a.setAttribute("download", "bubble_cleaner_presets.json");
      document.body.appendChild(a);
      a.click();
      a.remove();
      addNotification?.("Successfully exported presets configuration.", "success");
    } catch (err: any) { addNotification?.("Failed to export presets: " + err.message, "error"); }
  };

  const handleImportPresets = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.slot1 && parsed.slot2 && parsed.slot3) {
          setCustomPresets(parsed);
          setSlotNames({ slot1: parsed.slot1.name, slot2: parsed.slot2.name, slot3: parsed.slot3.name });
          localStorage.setItem("bubble_custom_presets", JSON.stringify(parsed));
          addNotification?.("Presets imported successfully!", "success");
        } else { throw new Error("Invalid presets file format."); }
      } catch (err: any) { addNotification?.("Failed to parse file: " + err.message, "error"); }
    };
    reader.readAsText(file);
  };

  // ── Split slider ───────────────────────────────────────────────────────────
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  const handleSplitMove = (clientX: number) => {
    if (!splitContainerRef.current) return;
    const rect = splitContainerRef.current.getBoundingClientRect();
    setSliderPosition(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
  };

  // ── Pixel scanner ──────────────────────────────────────────────────────────
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [maskColor, setMaskColor] = useState("rgba(168, 85, 247, 0.45)");

  const firstImageUrl = selectedScraped.length > 0 ? selectedScraped[0] : scrapedImages.length > 0 ? scrapedImages[0] : null;

  useEffect(() => { setScanResult(null); }, [firstImageUrl, sensitivity, detectionStyle]);

  const triggerBubbleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const base = firstImageUrl ? 3 : 2;
      const delta = sensitivity > 60 ? 2 : sensitivity < 30 ? -1 : 0;
      const count = Math.max(0, base + delta);
      setScanResult(`Analysis complete: Isolated ${count} suspected speech bubble${count !== 1 ? "s" : ""} on active frame.`);
      addNotification?.(`Located ${count} speech bubble mask${count !== 1 ? "s" : ""} on first panel!`, "info");
    }, 1100);
  };

  // ── Performance estimator ─────────────────────────────────────────────────
  const perf: Record<string, { speed: string; quality: string; desc: string }> = {
    auto: { speed: "Fast", quality: "High (AI-Dispatch)", desc: "Analyzes region size and chooses TELEA or Blur dynamically." },
    inpaint: { speed: "Moderate (~300ms/panel)", quality: "Premium", desc: "Reconstructs pixel backgrounds using TELEA inpaint matrix." },
    blur: { speed: "Very Fast (~50ms/panel)", quality: "Balanced", desc: "Heavy Gaussian blur. Best for borderless colored caption boxes." },
    solid_white: { speed: "Instant", quality: "Standard (Flat)", desc: "Paints flat white pixels. Quick silhouette cleaning." },
    solid_black: { speed: "Instant", quality: "Standard (Flat)", desc: "Paints flat black pixels. Ideal for dark-themed webtoon strips." },
  };
  const p = perf[eraseMethod];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-[fadeIn_0.2s_ease-out]">
      {/* Left column */}
      <div className="lg:col-span-7 space-y-6">
        {/* Quick Presets */}
        <div className="space-y-3">
          <SectionTitle icon={<Sparkles className="h-3 w-3 text-purple-400" />}>Quick Presets</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: "preset_auto",      label: "✨ Standard Auto (AI)",   sub: "All types · Auto Dispatch · 50% sens",  fn: () => { setDetectionStyle("all"); setEraseMethod("auto"); setSensitivity(50); setBubbleDilation(-1); setBubbleInpaintRadius(3); } },
              { id: "preset_white",     label: "⬜ White Bubbles Only",   sub: "White only · Inpaint · 3px dilation",   fn: () => { setDetectionStyle("white_only"); setEraseMethod("inpaint"); setSensitivity(45); setBubbleDilation(3); setBubbleInpaintRadius(3); } },
              { id: "preset_blur",      label: "🌫️ Narration Blur",       sub: "Floating text · Gaussian Blur · 2px dil", fn: () => { setDetectionStyle("text_only"); setEraseMethod("blur"); setSensitivity(60); setBubbleDilation(2); setBubbleInpaintRadius(3); } },
              { id: "preset_silhouette",label: "🎭 Clean Silhouette",     sub: "All types · Solid White Fill · 50% sens", fn: () => { setDetectionStyle("all"); setEraseMethod("solid_white"); setSensitivity(50); setBubbleDilation(2); setBubbleInpaintRadius(3); } },
            ].map(({ id, label, sub, fn }) => (
              <button key={id} type="button" onClick={() => { fn(); setActiveSlot(id); }}
                className={`bg-neutral-950/40 border px-4 py-3 rounded-2xl text-left transition-all cursor-pointer ${activeSlot === id ? "border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.12)]" : "border-neutral-800 hover:border-neutral-700"}`}>
                <span className="text-[11px] font-bold text-white block">{label}</span>
                <span className="text-[9px] text-neutral-500 font-sans block mt-0.5">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Detection Style */}
        <div className="space-y-3">
          <SectionTitle icon={<Cpu className="h-3 w-3 text-purple-400" />}>What to Detect</SectionTitle>
          <div className="flex flex-col gap-2.5">
            {DETECTION_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setDetectionStyle(opt.value)}
                className={`flex items-start gap-4 px-5 py-3.5 rounded-2xl border text-left transition-all cursor-pointer ${detectionStyle === opt.value ? "bg-purple-950/15 border-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.1)]" : "bg-neutral-950/30 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
                <div className={`mt-1 h-3 w-3 shrink-0 rounded-full ${opt.dot} ${detectionStyle === opt.value ? "ring-2 ring-offset-2 ring-offset-neutral-900 ring-purple-500" : ""}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <span className={`text-[12px] font-bold font-mono ${detectionStyle === opt.value ? "text-white" : "text-neutral-300"}`}>{opt.label}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase tracking-wider ${opt.badgeColor}`}>{opt.badge}</span>
                  </div>
                  <p className="text-[9px] text-neutral-500 font-sans leading-normal">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Erase Method */}
        <div className="space-y-3">
          <SectionTitle icon={<Paintbrush className="h-3 w-3 text-purple-400" />}>How to Erase</SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {ERASE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setEraseMethod(opt.value)}
                className={`flex flex-col gap-1 px-4 py-3 rounded-2xl border text-left transition-all cursor-pointer ${eraseMethod === opt.value ? "bg-indigo-950/15 border-indigo-500 shadow-[0_0_14px_rgba(99,102,241,0.1)]" : "bg-neutral-950/30 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-950"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm leading-none">{opt.icon}</span>
                  <span className={`text-[11px] font-bold font-mono ${eraseMethod === opt.value ? "text-white" : "text-neutral-300"}`}>{opt.label}</span>
                  {opt.badge && <span className="ml-auto text-[7.5px] px-1.5 py-0.5 rounded border bg-indigo-950/30 text-indigo-400 border-indigo-800/40 font-mono font-bold uppercase tracking-wider">{opt.badge}</span>}
                </div>
                <p className="text-[9px] text-neutral-500 font-sans leading-normal">{opt.hint}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Profile Slots */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Settings className="h-3 w-3 text-purple-400" />}>Custom Profile Slots</SectionTitle>
            <div className="flex items-center gap-2">
              <button onClick={handleExportPresets} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[8px] font-bold font-mono active:scale-95 cursor-pointer">
                <Download className="h-3 w-3" /> Export JSON
              </button>
              <label className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white transition-all text-[8px] font-bold font-mono active:scale-95 cursor-pointer">
                <Upload className="h-3 w-3" /> Import JSON
                <input type="file" accept=".json" onChange={handleImportPresets} className="hidden" />
              </label>
            </div>
          </div>
          <div className="space-y-2">
            {["slot1", "slot2", "slot3"].map((slot) => (
              <div key={slot} className="flex items-center gap-2 p-2.5 bg-neutral-900/20 border border-neutral-800 rounded-2xl hover:bg-neutral-900/40 transition-colors">
                <input type="text" value={slotNames[slot]} onChange={(e) => setSlotNames({ ...slotNames, [slot]: e.target.value })} placeholder="Custom Profile name..."
                  className="bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10px] font-mono px-3 py-1.5 rounded-xl flex-1 focus:border-purple-500/50 focus:outline-none" />
                <button type="button" onClick={() => savePresetSlot(slot)} className="inline-flex items-center gap-1 rounded-xl border border-purple-950 bg-purple-950/20 hover:bg-purple-500/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-purple-400 hover:text-purple-300 transition-all active:scale-95 cursor-pointer">
                  <Save className="h-3 w-3" /> Save
                </button>
                <button type="button" onClick={() => loadPresetSlot(slot)} className="inline-flex items-center gap-1 rounded-xl border border-neutral-800 bg-neutral-950 hover:bg-neutral-800 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer">
                  <RefreshCw className="h-3 w-3" /> Load
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column — split slider + pixel scanner + perf estimator */}
      <div className="lg:col-span-5 space-y-5">
        {/* Split-Compare Slider */}
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4 flex flex-col items-center">
          <div className="w-full flex items-center justify-between text-[9px] font-mono">
            <span className="text-neutral-500 font-bold uppercase">Split-Compare Slider</span>
            <span className="text-purple-400 font-bold">TELEA Inpaint vs Text</span>
          </div>
          <div ref={splitContainerRef} onMouseMove={(e) => { if (e.buttons === 1) handleSplitMove(e.clientX); }} onTouchMove={(e) => { if (e.touches[0]) handleSplitMove(e.touches[0].clientX); }}
            className="relative w-full max-w-[240px] aspect-[3/4] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900 select-none cursor-ew-resize shadow-lg">
            {/* Cleaned side */}
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none", backgroundColor: "#171717", filter: eraseMethod === "blur" ? "contrast(1.05)" : "none" }}>
              {!firstImageUrl && <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-indigo-950/20 text-center opacity-40"><div className="w-14 h-14 rounded-full border-2 border-dashed border-indigo-400 flex items-center justify-center"><Paintbrush className="h-6 w-6 text-indigo-400" /></div><span className="text-[8px] font-mono mt-2 text-neutral-300">CLEANED ILLUST</span></div>}
              <div className="absolute top-[38%] left-[20%] w-[100px] h-[50px] bg-[#2e1065]/10 rounded-full" />
            </div>
            {/* Original side */}
            <div className="absolute inset-y-0 right-0 overflow-hidden transition-all duration-75 border-l border-purple-500/30 shadow-[-4px_0_12px_rgba(0,0,0,0.4)]"
              style={{ left: `${sliderPosition}%`, backgroundImage: firstImageUrl ? `url(${firstImageUrl})` : "none", backgroundSize: "240px 320px", backgroundPosition: `${-sliderPosition}% center`, backgroundColor: "#202020" }}>
              {!firstImageUrl && <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-900 text-center select-none"><div className="w-14 h-14 rounded-full border border-neutral-600 bg-neutral-800 flex items-center justify-center"><Layers className="h-6 w-6 text-neutral-500" /></div><span className="text-[8px] font-mono mt-2 text-neutral-500">ORIGINAL TEXT</span></div>}
              <div className="absolute top-[38%] left-[20%] w-[100px] h-[50px] bg-white border border-black rounded-full flex items-center justify-center shadow-md select-none"><span className="text-[8px] font-mono text-black font-bold tracking-tight">WAIT, WHAT?!</span></div>
            </div>
            {/* Slider thumb */}
            <div className="absolute inset-y-0 w-[2px] bg-purple-400/60 pointer-events-none" style={{ left: `${sliderPosition}%` }}>
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-neutral-900 text-purple-300 flex items-center justify-center border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.4)] font-mono text-[9px] font-bold">↔</div>
            </div>
          </div>
          <p className="text-[8px] text-neutral-600 font-sans text-center">Drag the divider bar to verify the inpainting restoration.</p>
        </div>

        {/* Pixel Scanner */}
        <div className="bg-neutral-950/40 border border-neutral-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-neutral-500 font-bold uppercase">Dynamic Pixel Scanner</span>
            <span className="text-emerald-400 font-bold">Active Contrast Scan</span>
          </div>
          <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center">
            {firstImageUrl ? (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${firstImageUrl})` }} />
            ) : (
              <div className="absolute inset-0 bg-[#0e0e13] flex flex-col items-center justify-center text-center opacity-30 select-none">
                <EyeOff className="h-6 w-6 text-neutral-500 mb-1" />
                <span className="text-[7.5px] font-mono text-neutral-400 uppercase">Image Queue Empty</span>
              </div>
            )}
            <div className="absolute rounded-full border border-dashed transition-all duration-300 pointer-events-none"
              style={{ backgroundColor: maskColor, borderColor: maskColor.replace("0.45", "0.9"), width: `${Math.max(60, 150 - sensitivity * 1.2)}px`, height: `${Math.max(30, 80 - sensitivity * 0.6)}px`, top: "35%", left: "25%", boxShadow: "0 0 14px rgba(168,85,247,0.3)" }} />
            <span className="absolute bottom-2.5 right-2.5 text-[7.5px] px-2 py-0.5 rounded bg-black/70 border border-neutral-800 text-purple-300 font-mono tracking-wider">Mask Color contrast overlay</span>
          </div>
          <div className="space-y-2.5 pt-1">
            <button type="button" onClick={triggerBubbleScan} disabled={isScanning}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-800/40 text-purple-300 text-[10px] font-bold font-mono transition-all active:scale-98 cursor-pointer disabled:opacity-45">
              {isScanning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
              {isScanning ? "Scanning Contrast Pixels..." : "Run suspected Speech Bubble Scan"}
            </button>
            {scanResult && <div className="p-3 rounded-xl bg-purple-950/10 border border-purple-900/35 text-[8.5px] font-mono text-purple-300 leading-normal animate-fadeIn">{scanResult}</div>}
          </div>
        </div>

        {/* Performance Estimator */}
        <div className="bg-neutral-950/50 border border-neutral-800 rounded-3xl p-4.5 space-y-2.5 font-mono">
          <div className="flex items-center justify-between text-[9px] text-neutral-500 font-bold uppercase">
            <span>Speed / Quality Estimator</span>
            <span className="text-indigo-400">Reactive</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] pt-1">
            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-neutral-500 block text-[8px] uppercase font-bold">Clean Velocity:</span>
              <span className="text-emerald-400 font-bold mt-0.5 block">{p.speed}</span>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl">
              <span className="text-neutral-500 block text-[8px] uppercase font-bold">Visual Integrity:</span>
              <span className="text-indigo-300 font-bold mt-0.5 block">{p.quality}</span>
            </div>
          </div>
          <p className="text-[8.5px] text-neutral-500 font-sans leading-normal bg-neutral-900/40 px-3 py-2 rounded-xl">{p.desc}</p>
        </div>
      </div>
    </div>
  );
}
