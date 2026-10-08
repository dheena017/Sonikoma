import React from "react";
import {
  Video,
  Download,
  RefreshCw,
  Sparkles,
  Scissors,
  Brain,
  Mic,
  Film,
  CheckCircle2,
} from "lucide-react";

export interface AutoPipelineStepInfo {
  step: number; // 1 to 5
  total: number; // 5
  title: string; // "Merge" | "Auto-Crop" | "AI Analyze" | "Voice Audio" | "Render Video"
  detail: string; // descriptive status message
  progress?: number; // 0 to 100
}

export interface SidepanelFooterProps {
  hasPanels: boolean;
  isRendering: boolean;
  renderProgress: number;
  enabledCount: number;
  totalDuration: number;
  isScanning: boolean;
  isAutoPipelineRunning?: boolean;
  autoPipelineStep?: AutoPipelineStepInfo | null;
  onRender: () => void;
  onAutoPipeline?: () => void;
  onDownloadZip: () => void;
  onScan: () => void;
}

export const SidepanelFooter: React.FC<SidepanelFooterProps> = ({
  hasPanels,
  isRendering,
  renderProgress,
  enabledCount,
  totalDuration,
  isScanning,
  isAutoPipelineRunning = false,
  autoPipelineStep = null,
  onRender,
  onAutoPipeline,
  onDownloadZip,
  onScan,
}) => {
  const stepsList = [
    { num: 1, label: "Merge", icon: RefreshCw },
    { num: 2, label: "Crop", icon: Scissors },
    { num: 3, label: "Analyze", icon: Brain },
    { num: 4, label: "Audio", icon: Mic },
    { num: 5, label: "Video", icon: Film },
  ];

  const currentStep = autoPipelineStep?.step || 1;

  return (
    <footer className="p-3 bg-[#121212] border-t border-[#2f2f2f] flex flex-col gap-2 shrink-0 shadow-xl">
      {/* ── Auto-Pipeline 5-Step Progress Banner ── */}
      {isAutoPipelineRunning && (
        <div className="bg-[#181818] border border-purple-500/40 rounded-lg p-2 flex flex-col gap-1.5 shadow-inner">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Sparkles size={11} className="animate-spin text-purple-400" />
              <span>
                Full Auto Studio: Step {currentStep}/5 •{" "}
                {autoPipelineStep?.title || "Processing"}
              </span>
            </div>
            <span className="text-[#9ca3af] font-mono text-[9px]">
              {autoPipelineStep?.progress !== undefined
                ? `${Math.round(autoPipelineStep.progress)}%`
                : `${Math.round(((currentStep - 1) / 5) * 100)}%`}
            </span>
          </div>

          {/* Stepper indicator pills */}
          <div className="grid grid-cols-5 gap-1">
            {stepsList.map((st) => {
              const isPast = st.num < currentStep;
              const isCurrent = st.num === currentStep;
              return (
                <div
                  key={st.num}
                  className={`flex items-center justify-center gap-1 py-1 px-1 rounded text-[9px] font-semibold transition-all ${
                    isPast
                      ? "bg-emerald-950/70 border border-emerald-700/60 text-emerald-300"
                      : isCurrent
                      ? "bg-purple-950 border border-purple-500 text-purple-200 shadow-sm shadow-purple-900/50 animate-pulse"
                      : "bg-[#121212] border border-[#2f2f2f] text-[#6b7280]"
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 size={8} className="text-emerald-400" />
                  ) : (
                    <span>{st.num}.</span>
                  )}
                  <span className="truncate">{st.label}</span>
                </div>
              );
            })}
          </div>

          <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 via-indigo-500 to-sky-400 h-full transition-all duration-300"
              style={{
                width: `${
                  autoPipelineStep?.progress !== undefined
                    ? autoPipelineStep.progress
                    : Math.max(8, ((currentStep - 0.5) / 5) * 100)
                }%`,
              }}
            />
          </div>

          {autoPipelineStep?.detail && (
            <p className="text-[9px] text-[#9ca3af] truncate">
              {autoPipelineStep.detail}
            </p>
          )}
        </div>
      )}

      {/* ── Standalone Video Render Progress Animation ── */}
      {!isAutoPipelineRunning && isRendering && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-[#e5e5e5] font-medium">
            <span>Rendering Motion Comic ({renderProgress}%)...</span>
            <span className="animate-pulse text-[#3b82f6] font-mono">
              Synthesizing FFmpeg
            </span>
          </div>
          <div className="w-full bg-[#222222] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-sky-400 h-full transition-all duration-300"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
        </div>
      )}

      {hasPanels ? (
        <div className="flex items-center gap-2">
          {/* 1. Export Video Button */}
          <button
            type="button"
            onClick={onRender}
            disabled={
              isRendering || isAutoPipelineRunning || enabledCount === 0
            }
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-40 text-white font-bold text-[11px] shadow-lg shadow-blue-950/60 border border-blue-400/30 transition-all cursor-pointer truncate"
            title="Export and render final motion video via backend engine"
          >
            <Video size={13} className={isRendering ? "animate-spin" : ""} />
            <span className="truncate">
              {isRendering
                ? "Rendering..."
                : totalDuration > 0
                ? `Export (${enabledCount})`
                : `Export Video`}
            </span>
          </button>

          {/* 2. NEW ALL-IN-ONE PIPELINE BUTTON (In User Marked Location) */}
          {onAutoPipeline && (
            <button
              type="button"
              onClick={onAutoPipeline}
              disabled={
                isAutoPipelineRunning || isRendering || enabledCount === 0
              }
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:via-indigo-500 hover:to-sky-500 disabled:opacity-40 text-white font-bold text-[11px] shadow-lg shadow-purple-950/70 border border-purple-400/30 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] truncate"
              title="Full Auto Pipeline: 1. Merge Panels ➔ 2. Auto Crop ➔ 3. AI Analyze ➔ 4. Voice Audio ➔ 5. Render Final Video"
            >
              <Sparkles
                size={13}
                className={
                  isAutoPipelineRunning
                    ? "animate-spin text-purple-200 shrink-0"
                    : "text-purple-200 shrink-0"
                }
              />
              <span className="truncate">
                {isAutoPipelineRunning
                  ? `Step ${currentStep}/5...`
                  : "✨ Auto Video"}
              </span>
            </button>
          )}

          {/* 3. ZIP Download Button */}
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={isAutoPipelineRunning || isRendering}
            className="flex items-center justify-center gap-1 px-3 py-2.5 rounded-lg bg-[#1a1a1a] hover:bg-[#242424] border border-[#2f2f2f] hover:border-emerald-500/60 disabled:opacity-40 text-emerald-400 font-semibold text-xs transition-colors cursor-pointer shadow-sm shrink-0"
            title="Download chapter as clean ZIP archive"
          >
            <Download size={13} />
            <span>ZIP</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 text-white font-bold text-xs shadow-md border border-blue-400/30 transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
          <span>
            {isScanning
              ? "Scanning Reader DOM..."
              : "Scan Active Tab for Panels"}
          </span>
        </button>
      )}
    </footer>
  );
};

