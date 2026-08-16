import React from "react";
import { Check, Plus } from "lucide-react";
import { AppExtension } from "../../../types/workspace.types";

interface AppExtensionCardProps {
  app: AppExtension;
  isInstalled: boolean;
  onToggle: () => void;
}

export const AppExtensionCard: React.FC<AppExtensionCardProps> = ({
  app,
  isInstalled,
  onToggle,
}) => {
  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${app.color} border overflow-hidden transition-all`}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
          <img
            src={app.icon}
            alt={app.name}
            className="h-6 w-6 object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-bold text-white">{app.name}</p>
            {app.badge && (
              <span className="text-[8px] font-mono text-neutral-300 bg-white/10 px-1.5 py-0.5 rounded">
                {app.badge}
              </span>
            )}
          </div>
          <p className="text-[9px] text-neutral-300 leading-snug truncate">
            {app.desc}
          </p>
        </div>
        <button
          onClick={onToggle}
          className={`px-2.5 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
            isInstalled
              ? "bg-green-600/80 hover:bg-red-600/80 text-white"
              : "bg-white/15 hover:bg-purple-600 text-white"
          }`}
        >
          {isInstalled ? (
            <>
              <Check className="h-3 w-3" /> Connected
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Connect
            </>
          )}
        </button>
      </div>
    </div>
  );
};
