import React from "react";
import { Film, RefreshCw, FlaskConical } from "lucide-react";

export interface EmptyStoryboardStateProps {
  isScanning: boolean;
  onScan: () => void;
  onLoadSample: () => void;
}

export const EmptyStoryboardState: React.FC<EmptyStoryboardStateProps> = ({
  isScanning,
  onScan,
  onLoadSample,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-5 text-center bg-[#181818] rounded-2xl border border-[#2f2f2f] shadow-lg my-auto">
      <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
        <Film size={22} className="animate-pulse" />
      </div>
      <h3 className="font-bold text-[#e5e5e5] text-sm">
        Ready to Create Motion Comics
      </h3>
      <p className="text-[11px] text-[#9ca3af] mt-1 max-w-xs leading-relaxed">
        Open any manga, comic, or webtoon chapter in your browser to detect
        panels, or load our sample demo storyboard below.
      </p>

      <div className="flex flex-col w-full gap-2 mt-4 max-w-xs">
        <button
          type="button"
          onClick={onScan}
          disabled={isScanning}
          className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
          <span>
            {isScanning ? "Scanning Active Tab..." : "Scan Active Tab"}
          </span>
        </button>

        <button
          type="button"
          onClick={onLoadSample}
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#222222] hover:bg-[#2a2a2a] border border-[#2f2f2f] text-[#e5e5e5] font-semibold text-xs transition-colors cursor-pointer"
        >
          <FlaskConical size={13} />
          <span>Load Sample Demo (3 Panels)</span>
        </button>
      </div>
    </div>
  );
};
