import React from "react";
import { Star, Download, ShoppingCart } from "lucide-react";
import { MarketplacePack } from "../../../types/workspace.types";

interface MarketplacePackCardProps {
  pack: MarketplacePack;
  onPurchase: () => void;
}

export const MarketplacePackCard: React.FC<MarketplacePackCardProps> = ({
  pack,
  onPurchase,
}) => {
  const isFree = pack.price === "Free";

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 overflow-hidden cursor-pointer transition-all group shadow-sm">
      <div className="relative h-20 overflow-hidden">
        <img
          src={pack.img}
          alt={pack.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
        <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-black/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
          {pack.badge}
        </span>
        <span
          className={`absolute top-2 right-2 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${
            isFree
              ? "bg-green-500/80 text-white"
              : "bg-purple-600/80 text-white"
          }`}
        >
          {pack.price}
        </span>
      </div>
      <div className="p-2.5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold text-white truncate">{pack.title}</p>
          <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 font-mono">
            <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400" />
            <span>{pack.rating}</span>
            <Download className="h-2.5 w-2.5" />
            <span>{pack.downloads}</span>
          </div>
        </div>
        <button
          onClick={onPurchase}
          className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
        >
          <ShoppingCart className="h-3 w-3" />
          {isFree ? "Get Free" : "Buy"}
        </button>
      </div>
    </div>
  );
};
