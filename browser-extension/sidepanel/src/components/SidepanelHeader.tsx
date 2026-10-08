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
    <header className="flex items-center justify-between px-3 py-2 bg-[#121212] border-b border-[#2f2f2f] shrink-0">
      <div className="flex items-center gap-2">
        <SonikomaLogo size="xs" badge="PRO" />
        <div
          onClick={onCheckHealth}
          className="flex items-center gap-1 text-[10px] text-[#9ca3af] hover:text-[#e5e5e5] cursor-pointer transition-colors"
          title="FastAPI Server Status (click to test)"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isBackendOnline
                ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                : "bg-amber-400"
            }`}
          />
          <span className="text-[9px] font-medium text-[#9ca3af]">
            {isBackendOnline ? "Engine Online" : "Local"}
          </span>
        </div>
      </div>

      {/* Quick Action Pills */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleCinema}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1a1a] hover:bg-[#262626] border border-[#2f2f2f] text-amber-400 hover:text-amber-300 text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
          title="Launch Fullscreen Manga Cinema Player"
        >
          <Tv size={11} />
          <span>Cinema</span>
        </button>

        <button
          type="button"
          onClick={onOpenWebStudio}
          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#3b82f6]/15 hover:bg-[#3b82f6]/25 border border-[#3b82f6]/40 text-[#60a5fa] text-[10px] font-semibold transition-all cursor-pointer shadow-sm"
          title="Open Full Web Studio"
        >
          <span>Studio</span>
          <ExternalLink size={10} />
        </button>
      </div>
    </header>
  );
};
