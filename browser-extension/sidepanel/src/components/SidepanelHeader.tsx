import React from "react";
import { SonikomaLogo } from "../../../shared/SonikomaLogo";
import { Tv, ExternalLink } from "lucide-react";

export interface SidepanelHeaderProps {
  isBackendOnline: boolean;
  onCheckHealth: () => void;
  onToggleCinema: () => void;
  onOpenWebStudio: () => void;
}

export const SidepanelHeader: React.FC<SidepanelHeaderProps> = ({
  isBackendOnline,
  onCheckHealth,
  onToggleCinema,
  onOpenWebStudio,
}) => {
  return (
    <header className="flex items-center justify-between px-3 py-2 bg-[#0d1322] border-b border-[#1e293b] shrink-0">
      <div className="flex items-center gap-2">
        <SonikomaLogo size="xs" badge="PRO" />
        <div
          onClick={onCheckHealth}
          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
          title="FastAPI Server Status (click to test)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendOnline ? "bg-emerald-400 shadow-[0_0_6px_#10b981]" : "bg-amber-400"
            }`}
          />
          <span className="text-[9px] font-medium text-slate-400">
            {isBackendOnline ? "Engine Online" : "Local"}
          </span>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleCinema}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#161d2d] hover:bg-[#1f2a40] border border-[#26354d] text-amber-400 hover:text-amber-300 text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
          title="Launch Fullscreen Manga Cinema Player"
        >
          <Tv size={11} />
          <span>Cinema</span>
        </button>

        <button
          type="button"
          onClick={onOpenWebStudio}
          className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
          title="Open Full Web Studio"
        >
          <span>Studio</span>
          <ExternalLink size={10} />
        </button>
      </div>
    </header>
  );
};
