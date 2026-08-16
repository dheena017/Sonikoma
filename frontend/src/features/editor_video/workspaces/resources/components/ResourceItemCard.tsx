import React from "react";
import { Package, Copy, Check } from "lucide-react";
import { ResourceItem } from "../../../types/workspace.types";

interface ResourceItemCardProps {
  resource: ResourceItem;
  copiedId: string | null;
  onCopyColor: (id: string, hex: string) => void;
  onApply: (title: string) => void;
}

export const ResourceItemCard: React.FC<ResourceItemCardProps> = ({
  resource,
  copiedId,
  onCopyColor,
  onApply,
}) => {
  return (
    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 transition-all flex items-center justify-between group shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        {resource.hex ? (
          <div
            className="h-8 w-8 rounded-lg shrink-0 border border-white/20 shadow-inner"
            style={{ backgroundColor: resource.hex }}
          />
        ) : (
          <div className="h-8 w-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0">
            <Package className="h-4 w-4 text-purple-400" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">
            {resource.title}
          </p>
          <p className="text-[10px] text-neutral-400 font-mono truncate">
            {resource.detail}
          </p>
        </div>
      </div>

      {resource.hex ? (
        <button
          onClick={() => onCopyColor(resource.id, resource.hex!)}
          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-purple-600 text-white text-[9px] font-mono font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
        >
          {copiedId === resource.id ? (
            <Check className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
          {resource.hex}
        </button>
      ) : (
        <button
          onClick={() => onApply(resource.title)}
          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold shrink-0 transition-colors cursor-pointer"
        >
          Apply
        </button>
      )}
    </div>
  );
};
