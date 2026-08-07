import React from "react";
import { Star } from "lucide-react";
import { MediaAsset } from "../../../types/workspace.types";

interface MediaAssetCardProps {
  asset: MediaAsset;
  onSelect: () => void;
}

export const MediaAssetCard: React.FC<MediaAssetCardProps> = ({ asset, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="relative rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 h-28 cursor-pointer group hover:border-purple-500/60 transition-all flex flex-col justify-between p-2 shadow-sm"
    >
      <img
        src={asset.url}
        alt={asset.title}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
      <div className="relative z-10 flex justify-between items-center">
        <span className="text-[8px] font-mono font-bold bg-black/80 text-white px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/10">
          {asset.badge}
        </span>
        <Star className="h-3 w-3 text-neutral-400 hover:text-amber-400 cursor-pointer" />
      </div>
      <div className="relative z-10">
        <p className="text-[10px] font-bold text-white truncate drop-shadow">{asset.title}</p>
        {asset.duration && <span className="text-[8px] text-neutral-300 font-mono">{asset.duration}</span>}
      </div>
    </div>
  );
};
