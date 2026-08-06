import React from "react";
import { Image, Layers, Sparkles, Zap, ShieldCheck, Cpu } from "lucide-react";
import { useAutoCropPresets } from "@/features/image_editor/hooks/crop/useAutoCropPresets";
import { AutoCropSharedProps } from "@/features/scraper/components/tabTypes";
import { AutoCropPresetGrid } from "./AutoCropPresetGrid";
import { AutoCropEngineSelectorV2 } from "./AutoCropEngineSelectorV2";
import { AutoCropContextWrapper } from "./AutoCropContextWrapper";
import { AutoCropComplexityAnalysis } from "./AutoCropComplexityAnalysis";
import { getProxiedImageUrl } from "@/utils";

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
      <div className="w-full h-full flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-6 animate-[fadeIn_0.22s_ease-out] items-start">
        {/* ── Left Column (5 cols on lg+): Presets & Webtoon Seam Slicer ── */}
        <div className="lg:col-span-5 flex flex-col space-y-5 w-full">
          {/* Section 1: Presets */}
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl space-y-4 shadow-xl backdrop-blur-md">
            <AutoCropPresetGrid
              activeSlot={activeSlot}
              applyPreset={applyBuiltInPreset}
              firstImageUrl={firstImageUrl}
            />
          </div>



          {/* Section 3: Live Image Edge Complexity Analysis */}
          {firstImageUrl && (
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
              <div className="relative h-44 w-full bg-neutral-900 rounded-2xl overflow-hidden border border-neutral-800 group">
                <img
                  src={getProxiedImageUrl(firstImageUrl)}
                  alt="Target Preview"
                  className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-[9px] font-mono font-bold text-neutral-300">
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
                    Aspect: {props.aspectRatioLock.toUpperCase()}
                  </span>
                  <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10 text-emerald-400">
                    {props.useLocalCV ? "⚡ OPENCV ACTIVE" : "✨ GEMINI AI ACTIVE"}
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
          <div className="bg-neutral-950/40 border border-neutral-850 p-4 sm:p-5 rounded-3xl space-y-5 shadow-xl backdrop-blur-md">
            <AutoCropEngineSelectorV2 legacyProps={props} />
          </div>
        </div>
      </div>
    </AutoCropContextWrapper>
  );
});
