import React, { useState, useRef, useEffect } from "react";
import { ServerStatusPopover } from "./ServerStatusPopover";

interface ServerStatusIndicatorProps {
  status: "online" | "offline" | "checking";
  showLabel?: boolean;
  onClick?: () => void;
}

export const ServerStatusIndicator: React.FC<ServerStatusIndicatorProps> = ({
  status,
  showLabel = true,
  onClick,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getStatusColors = () => {
    switch (status) {
      case "online":
        return {
          pulseBg: "bg-emerald-400",
          dotBg: "bg-emerald-500",
          textColor: "text-[#00f59b]",
          ringBg: "bg-emerald-950/80",
          ringBorder: "border-emerald-500/40",
          shadow: "shadow-[0_0_8px_rgba(16,185,129,0.7)]",
        };
      case "offline":
        return {
          pulseBg: "bg-rose-400",
          dotBg: "bg-rose-500",
          textColor: "text-rose-400",
          ringBg: "bg-rose-950/80",
          ringBorder: "border-rose-500/40",
          shadow: "shadow-[0_0_8px_rgba(244,63,94,0.7)]",
        };
      case "checking":
        return {
          pulseBg: "bg-amber-400",
          dotBg: "bg-amber-500",
          textColor: "text-amber-400",
          ringBg: "bg-amber-950/80",
          ringBorder: "border-amber-500/40",
          shadow: "shadow-[0_0_8px_rgba(245,158,11,0.7)]",
        };
    }
  };

  const colors = getStatusColors();

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (onClick) onClick();
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        title={`Server Status: ${status.toUpperCase()} (Click to view full diagnostics)`}
        className={`h-8.5 flex items-center gap-2 px-3 rounded-xl bg-[#202127] hover:bg-[#282a32] text-xs font-medium text-white transition-all shadow-2xs select-none shrink-0 cursor-pointer active:scale-95 ${
          isOpen ? "bg-[#282a32]" : ""
        }`}
      >
        <span className="relative flex h-2 w-2 items-center justify-center shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${colors.pulseBg}`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${colors.dotBg}`}
          />
        </span>
        {showLabel && (
          <span className="hidden sm:inline text-white font-medium">Server:</span>
        )}
        <span
          className={`font-bold uppercase tracking-wider font-mono text-[11px] ${colors.textColor}`}
        >
          {status}
        </span>
      </button>

      {/* Interactive Popover */}
      {isOpen && (
        <div className="absolute right-0 sm:right-auto sm:left-0 top-full mt-2 z-50">
          <ServerStatusPopover
            status={status}
            onClose={() => setIsOpen(false)}
            onRecheck={onClick}
          />
        </div>
      )}
    </div>
  );
};

export default ServerStatusIndicator;
