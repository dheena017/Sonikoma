import React from "react";

interface ServerStatusIndicatorProps {
  status: "online" | "offline" | "checking";
  showLabel?: boolean;
}

export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({
  status,
  showLabel = true,
}) => {
  const getStatusColors = () => {
    switch (status) {
      case "online":
        return {
          pulseBg: "bg-emerald-400",
          dotBg: "bg-emerald-500",
          textColor: "text-emerald-400",
        };
      case "offline":
        return {
          pulseBg: "bg-rose-450",
          dotBg: "bg-rose-500",
          textColor: "text-rose-400",
        };
      case "checking":
        return {
          pulseBg: "bg-amber-400",
          dotBg: "bg-amber-500",
          textColor: "text-amber-400",
        };
    }
  };

  const colors = getStatusColors();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#18191e] border border-[#2b2d35] text-[10px] sm:text-xs font-medium font-sans select-none hover:border-neutral-600 transition-all shadow-sm shrink-0">
      <span className="relative flex h-3 sm:h-3.5 w-3 sm:w-3.5 items-center justify-center rounded-full bg-emerald-950/80 border border-emerald-500/40 shrink-0">
        <span
          className={`absolute inline-flex h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full opacity-75 animate-ping ${colors.pulseBg}`}
        />
        <span
          className={`relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 ${colors.dotBg} shadow-[0_0_6px_#10b981]`}
        />
      </span>
      {showLabel && (
        <span className="hidden sm:inline text-neutral-300 font-medium">Server:</span>
      )}
      <span
        className={`font-black uppercase tracking-wider font-mono text-[9px] sm:text-[11px] ${
          status === "online" ? "text-[#00f59b]" : colors.textColor
        }`}
      >
        {status}
      </span>
    </div>
  );
};

export default ServerStatusIndicator;
