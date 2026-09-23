import React from "react";
import { Sparkles, Download, RefreshCw } from "lucide-react";

export interface SidepanelFooterProps {
  hasPanels: boolean;
  isRendering: boolean;
  renderProgress: number;
  enabledCount: number;
  totalDuration: number;
  isScanning: boolean;
  onRender: () => void;
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
  onRender,
  onDownloadZip,
  onScan,
}) => {
  return (
    <footer className="p-3 bg-[#0d1322] border-t border-[#1e293b] flex flex-col gap-2 shrink-0 shadow-xl">
      {/* ── Render Progress Animation ── */}
      {isRendering && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[10px] text-slate-300 font-medium">
            <span>Rendering Motion Comic ({renderProgress}%)...</span>
            <span className="animate-pulse text-sky-400 font-mono">Synthesizing FFmpeg</span>
          </div>
          <div className="w-full bg-[#1e293b] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-sky-400 h-full transition-all duration-300"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
        </div>
      )}

      {hasPanels ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRender}
            disabled={isRendering || enabledCount === 0}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-950/60 transition-all cursor-pointer"
          >
            <Sparkles size={14} className={isRendering ? "animate-spin" : ""} />
            <span>
              {isRendering
                ? "Rendering Motion Video..."
                : totalDuration > 0
                ? `Render Video (${enabledCount} Scenes • ~${Math.round(totalDuration)}s)`
                : `Render Video (${enabledCount} Scenes)`}
            </span>
          </button>

          <button
            type="button"
            onClick={onDownloadZip}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg bg-[#141d2d] hover:bg-[#1c283e] border border-[#23324c] hover:border-emerald-500 text-emerald-400 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
            title="Download chapter as clean ZIP archive"
          >
            <Download size={14} />
            <span>ZIP</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onScan}
          disabled={isScanning}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
          <span>{isScanning ? "Scanning Reader DOM..." : "Scan Active Tab for Panels"}</span>
        </button>
      )}
    </footer>
  );
};
