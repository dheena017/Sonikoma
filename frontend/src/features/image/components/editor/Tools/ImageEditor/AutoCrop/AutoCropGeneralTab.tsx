import React from "react";
import { Image, Layers, Sparkles, Zap, ShieldCheck, Cpu } from "lucide-react";
import { useAutoCropPresets } from "@/features/image/hooks/crop/useAutoCropPresets";
import { AutoCropSharedProps } from "@/features/scraper/components/tabTypes";
import { AutoCropPresetGrid } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropPresetGrid";
import { AutoCropEngineSelectorV2 } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineSelectorV2";
import { AutoCropContextWrapper } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropContextWrapper";
import { AutoCropComplexityAnalysis } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropComplexityAnalysis";
import { getProxiedImageUrl } from "@/utils";
import { useAutoCrop } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext";

const GeneralTabInner = React.memo(function GeneralTabInner(props: AutoCropSharedProps & { firstImageUrl: string | null; batchCount: number; activeSlot: string | null; applyBuiltInPreset: any }) {
  const { settings, updateSettings, setActiveEngine, activeEngine } = useAutoCrop();
  const { firstImageUrl, batchCount, activeSlot, applyBuiltInPreset } = props;

  const handleImageTypeChange = (type: "auto" | "strip" | "panel") => {
    updateSettings({ imageType: type });
    // Legacy sync
    if (type === "strip") props.setAutoSplitTallStrips(true);
    if (type === "panel") props.setAutoSplitTallStrips(false);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 animate-[fadeIn_0.22s_ease-out] items-start">
      {/* ── Left Column (5 cols on lg+): Image Type & Presets ── */}
      <div className="lg:col-span-5 flex flex-col space-y-5 w-full">

        {/* New Image Type Selector */}
        <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl shadow-xl backdrop-blur-md flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1">
            <Image className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Image Type
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { id: "auto", label: "Auto Detect", desc: "Recommended. Automatically determines strip vs panel." },
              { id: "strip", label: "Long Comic Strip", desc: "Multiple panels combined in a single long image." },
              { id: "panel", label: "Individual Panels", desc: "Every image is already a single panel." },
            ].map((type) => {
              const isActive = settings.imageType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => handleImageTypeChange(type.id as "auto" | "strip" | "panel")}
                  className={`flex items-start gap-3 p-3 rounded-2xl border text-left transition-all ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                  }`}
                >
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isActive ? "border-indigo-400" : "border-neutral-600"
                  }`}>
                    {isActive && <div className="w-2 h-2 rounded-full bg-indigo-400" />}
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${isActive ? "text-indigo-300" : "text-neutral-300"}`}>
                      {type.label}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5 leading-tight">
                      {type.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 1: Presets */}
        <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
          <AutoCropPresetGrid
            activeSlot={activeSlot as any}
            applyPreset={applyBuiltInPreset}
            firstImageUrl={firstImageUrl}
          />
        </div>

        {/* Section 3: Live Image Edge Complexity Analysis */}
          {firstImageUrl && typeof firstImageUrl === "string" && (
            <AutoCropComplexityAnalysis
              firstImageUrl={firstImageUrl}
              setCannyLow={props.setCropCannyLow}
              setCannyHigh={props.setCropCannyHigh}
              addNotification={props.addNotification}
            />
          )}

          {/* Section 4: Live Image Preview & Batch Inspection Card */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Batch & Target Preview
                </span>
              </div>
              <span className="text-[9px] font-mono px-2.5 py-0.5 rounded-full font-bold bg-indigo-950/60 border border-indigo-900/40 text-indigo-300">
                {batchCount > 0 ? `${batchCount} IMAGES QUEUED` : "NO IMAGES QUEUED"}
              </span>
            </div>

            {firstImageUrl ? (
              <div className="relative h-44 w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 group flex items-center justify-center">
                <img
                  src={getProxiedImageUrl(firstImageUrl)}
                  alt="Target Preview"
                  className="max-w-full max-h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute top-2.5 left-3 right-3 flex flex-col gap-1 items-start text-[9px] font-mono font-bold text-neutral-300 pointer-events-none">
                   {settings.imageType === "strip" && (
                     <div className="bg-indigo-950/80 backdrop-blur-sm px-2 py-1 rounded border border-indigo-500/30 text-indigo-300 flex items-center gap-1.5">
                       <Zap className="w-3 h-3" /> Analyzing image...
                     </div>
                   )}
                   {settings.imageType === "strip" && (
                      <div className="bg-emerald-950/80 backdrop-blur-sm px-2 py-1 rounded border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-3 h-3" /> Long Comic Strip detected
                      </div>
                   )}
                </div>
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[9px] font-mono font-bold text-neutral-300">
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    Aspect: {props.aspectRatioLock?.toUpperCase() || "FREE"}
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-emerald-400">
                    {activeEngine === "opencv" ? "⚡ OPENCV ACTIVE" : activeEngine === "aiSmart" ? "✨ AI ACTIVE" : "⭐ HYBRID ACTIVE"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="h-32 w-full bg-neutral-900/50 rounded-2xl border border-dashed border-neutral-800 flex flex-col items-center justify-center gap-2 text-neutral-500">
                <Image className="h-8 w-8 text-neutral-700" />
                <span className="text-[10px] font-mono">No target image loaded</span>
              </div>
            )}

            {/* Smart Tip Banner */}
            <div className="p-3 bg-neutral-900/60 border border-neutral-850 rounded-2xl text-[9.5px] font-mono text-neutral-400 leading-relaxed flex items-start gap-2 select-none">
              <Sparkles className="h-4 w-4 shrink-0 text-indigo-400 mt-0.5" />
              <p>
                <strong>Pro Tip:</strong> OpenCV Engine runs 100% locally with zero API limits. For overlapping panels or splash art, switch to Gemini AI Engine on the right.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Column (7 cols on lg+): Detection Engine & Fine Tuning ── */}
        <div className="lg:col-span-7 flex flex-col space-y-5 w-full">
          {/* New Engine Selector */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl space-y-5 shadow-xl backdrop-blur-md">
             <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Crop Engine
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "hybrid", label: "Hybrid ⭐", desc: "Recommended" },
                    { id: "aiSmart", label: "AI (YOLO)", desc: "Deep Learning" },
                    { id: "opencv", label: "OpenCV", desc: "Fast & Local" },
                  ].map((engine) => {
                    const isActive = activeEngine === engine.id;
                    return (
                      <button
                        key={engine.id}
                        onClick={() => {
                          setActiveEngine(engine.id as any);
                          // Sync with legacy props for now
                          if (engine.id === "aiSmart") props.setUseLocalCV?.(false);
                          else if (engine.id === "opencv") props.setUseLocalCV?.(true);
                          else props.setUseLocalCV?.(true); // hybrid uses local CV base
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                          isActive
                            ? "bg-indigo-500/10 border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                            : "bg-neutral-900 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/80"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isActive ? "text-indigo-300" : "text-neutral-300"}`}>
                          {engine.label}
                        </span>
                        <span className="text-[9px] text-neutral-500 mt-1">
                          {engine.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
             </div>

             <div className="h-px w-full bg-neutral-800 my-4" />

            <AutoCropEngineSelectorV2 legacyProps={props} />
          </div>
        </div>
      </div>
  );
});

export const AutoCropGeneralTab = React.memo(function AutoCropGeneralTab(props: AutoCropSharedProps) {
  const { activeSlot, applyBuiltInPreset } = useAutoCropPresets(props);

  const firstImageUrl =
    props.previewImageUrl ||
    (props.selectedScraped.length > 0
      ? props.selectedScraped[0]
      : props.scrapedImages.length > 0
      ? props.scrapedImages[0]
      : null);

  const batchCount = props.selectedScraped.length > 0
    ? props.selectedScraped.length
    : props.scrapedImages.length;

  return (
    <AutoCropContextWrapper legacyProps={props}>
      <GeneralTabInner
        {...props}
        firstImageUrl={firstImageUrl as any}
        batchCount={batchCount}
        activeSlot={activeSlot as any}
        applyBuiltInPreset={applyBuiltInPreset}
      />
    </AutoCropContextWrapper>
  );
});
