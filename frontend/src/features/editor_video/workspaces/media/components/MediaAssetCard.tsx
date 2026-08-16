import React from "react";
import { Star } from "lucide-react";
import { MediaAsset } from "../../../types/workspace.types";

interface MediaAssetCardProps {
  asset: MediaAsset;
  onSelect: () => void;
}

export const MediaAssetCard: React.FC<MediaAssetCardProps> = ({
  asset,
  onSelect,
}) => {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-[1.75rem] overflow-hidden border border-white/5 bg-[#07060f] h-28 cursor-pointer group hover:border-purple-500/30 transition-all flex flex-col justify-between p-3 shadow-[0_18px_42px_rgba(0,0,0,0.18)] hover:shadow-[0_18px_48px_rgba(168,85,247,0.22)]"
    >
      <img
        src={asset.url}
        alt={asset.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
      <div className="relative z-10 flex justify-between items-start gap-2">
        <span className="text-[9px] font-semibold font-mono bg-black/70 text-white px-2 py-1 rounded-full border border-white/10 backdrop-blur-sm">
          {asset.badge}
        </span>
        <Star className="h-3.5 w-3.5 text-neutral-400 hover:text-amber-300 cursor-pointer transition-colors" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-semibold text-white truncate drop-shadow-sm">
          {asset.title}
        </p>
        {asset.duration && (
          <span className="text-[9px] text-neutral-300 font-mono">
            {asset.duration}
          </span>
        )}
      </div>
    </div>
  );
};
