import React from "react";

interface MarketplaceFeaturedBannerProps {
  title: string;
  subtitle: string;
  tag?: string;
}

export const MarketplaceFeaturedBanner: React.FC<MarketplaceFeaturedBannerProps> = ({
  title,
  subtitle,
  tag = "🔥 FEATURED THIS WEEK",
}) => {
  return (
    <div className="rounded-2xl overflow-hidden relative h-24 border border-purple-500/30">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-950" />
      <div className="relative z-10 p-4 flex flex-col justify-between h-full">
        <span className="text-[9px] font-mono font-bold text-purple-300">{tag}</span>
        <div>
          <h3 className="text-sm font-black text-white">{title}</h3>
          <p className="text-[9px] text-neutral-300">{subtitle}</p>
        </div>
      </div>
    </div>
  );
};
