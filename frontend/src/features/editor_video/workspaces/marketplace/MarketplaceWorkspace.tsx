import React, { useState } from "react";
import { WorkspaceLayout } from "../../shared/WorkspaceLayout";
import { MARKETPLACE_SUB_TABS, MOCK_MARKETPLACE_PACKS } from "../../data/marketplaceData";
import { Star, Download, ShoppingCart } from "lucide-react";

interface MarketplaceWorkspaceProps {
  onTriggerFeedback: (msg: string) => void;
}

export const MarketplaceWorkspace: React.FC<MarketplaceWorkspaceProps> = ({ onTriggerFeedback }) => {
  const [activeTab, setActiveTab] = useState("Comic Packs");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <WorkspaceLayout>
      <WorkspaceLayout.Header title="Marketplace" />
      <WorkspaceLayout.Tabs tabs={MARKETPLACE_SUB_TABS} activeTab={activeTab} onSelectTab={setActiveTab} />
      <WorkspaceLayout.Search value={searchQuery} onChange={setSearchQuery} placeholder="Search packs, plugins, voice kits..." />
      <WorkspaceLayout.Content>
        {/* Featured Banner */}
        <div className="rounded-2xl overflow-hidden relative h-24 border border-purple-500/30">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950" />
          <div className="relative z-10 p-4 flex flex-col justify-between h-full">
            <span className="text-[9px] font-mono font-bold text-purple-300">🔥 FEATURED THIS WEEK</span>
            <div>
              <h3 className="text-sm font-black text-white">Cyberpunk Webtoon Mega Pack</h3>
              <p className="text-[9px] text-neutral-300">100+ assets · 4K panels · 12 transitions</p>
            </div>
          </div>
        </div>

        {/* Packs Grid */}
        <div className="space-y-2 pt-1">
          {MOCK_MARKETPLACE_PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 overflow-hidden cursor-pointer transition-all group"
            >
              <div className="relative h-20 overflow-hidden">
                <img src={pack.img} alt={pack.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent" />
                <span className="absolute top-2 left-2 text-[8px] font-mono font-bold bg-black/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {pack.badge}
                </span>
                <span className={`absolute top-2 right-2 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded ${pack.price === "Free" ? "bg-green-500/80 text-white" : "bg-purple-600/80 text-white"}`}>
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
                  onClick={() => onTriggerFeedback(`${pack.price === "Free" ? "Downloaded" : "Purchased"}: ${pack.title}`)}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                >
                  <ShoppingCart className="h-3 w-3" />
                  {pack.price === "Free" ? "Get Free" : "Buy"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </WorkspaceLayout.Content>
      <WorkspaceLayout.Footer text="Sonikoma Creator Marketplace" />
    </WorkspaceLayout>
  );
};
