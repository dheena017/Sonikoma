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
    <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-850 text-[10px] font-medium font-sans select-none hover:border-neutral-750 transition-all">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${colors.pulseBg}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${colors.dotBg}`}
        />
      </span>
      {showLabel && <span className="text-neutral-400">Server:</span>}
      <span
        className={`font-bold uppercase tracking-wider ${colors.textColor}`}
      >
        {status}
      </span>
    </div>
  );
};

export default ServerStatusIndicator;
