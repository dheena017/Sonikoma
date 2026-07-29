import React from "react";
import { AutoCropEngineSelector } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/AutoCropEngineSelector";
import { useAutoCrop } from "@/features/image/components/editor/Tools/ImageEditor/AutoCrop/contexts/AutoCropContext";

export function AutoCropEngineSelectorV2({ legacyProps }: { legacyProps: any }) {
  const { activeEngine, settings, updateEngineSettings } = useAutoCrop();

  return (
    <div className="space-y-6">
      {activeEngine === "hybrid" && (
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 text-neutral-300 text-xs">
           <div className="font-bold text-indigo-400 mb-2 uppercase tracking-wider text-[10px]">Hybrid Mode Settings</div>
           <div className="flex gap-2">
             {["fast", "balanced", "accurate"].map(mode => (
               <button
                 key={mode}
                 className={`flex-1 py-2 px-3 rounded-lg border text-center transition-all capitalize ${
                   settings.hybrid.mode === mode
                     ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-bold"
                     : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
                 }`}
                 onClick={() => updateEngineSettings("hybrid", { mode })}
               >
                 {mode}
               </button>
             ))}
           </div>
           <div className="mt-4 text-[10px] text-neutral-500 leading-relaxed">
             <strong>Hybrid Mode</strong> intelligently combines local OpenCV heuristics for initial passes and AI validation for complex layouts. It is recommended for most workloads.
           </div>
        </div>
      )}

      {activeEngine === "aiSmart" && (
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
           <div className="font-bold text-indigo-400 mb-2 uppercase tracking-wider text-[10px]">AI (YOLO) Engine Settings</div>
           <AutoCropEngineSelector {...legacyProps} useLocalCV={false} />
        </div>
      )}

      {activeEngine === "opencv" && (
        <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800">
           <div className="font-bold text-cyan-400 mb-2 uppercase tracking-wider text-[10px]">OpenCV Engine Settings</div>
           <AutoCropEngineSelector {...legacyProps} useLocalCV={true} />
        </div>
      )}
    </div>
  );
}
