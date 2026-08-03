import React from "react";
import { Check, Sparkles } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: number | string;
  billingPeriod?: string;
  desc: string;
  features: string[];
  excludedFeatures?: string[];
  isPopular?: boolean;
  btnText: string;
  onClick: () => void;
  themeMode?: "dark" | "light";
}

export function PricingCard({
  title,
  price,
  billingPeriod = "/month",
  desc,
  features,
  excludedFeatures = [],
  isPopular = false,
  btnText,
  onClick,
  themeMode = "dark",
}: PricingCardProps) {
  const isLight = themeMode === "light";

  return (
    <div
      className={`p-8 rounded-[32px] border transition-all duration-300 flex flex-col justify-between relative group ${
        isPopular
          ? isLight
            ? "border-purple-500 bg-gradient-to-b from-purple-50/80 to-white shadow-2xl shadow-purple-500/15"
            : "border-purple-500 bg-gradient-to-b from-purple-950/30 to-neutral-900 shadow-2xl shadow-purple-900/30"
          : isLight
          ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl shadow-slate-200/50"
          : "border-white/10 bg-neutral-900/50 hover:border-white/20 hover:bg-neutral-900/80 hover:shadow-xl shadow-black/40"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Most Popular
        </span>
      )}
      <div className="space-y-6">
        <div>
          <h3 className={`text-2xl font-black mb-2 transition-colors ${
            isLight ? "text-slate-900" : "text-white"
          }`}>
            {title}
          </h3>
          <p className={`text-sm transition-colors ${
            isLight ? "text-slate-500" : "text-neutral-400"
          }`}>
            {desc}
          </p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className={`text-5xl font-black tracking-tight transition-colors ${
            isLight ? "text-slate-950" : "text-white"
          }`}>
            {typeof price === "number" ? `$${price}` : price}
          </span>
          <span className={`text-sm font-medium transition-colors ${
            isLight ? "text-slate-400" : "text-neutral-500"
          }`}>
            {billingPeriod}
          </span>
        </div>
        <div className={`border-t pt-6 space-y-3.5 transition-colors ${
          isLight ? "border-slate-100" : "border-white/5"
        }`}>
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span className={`text-sm font-medium transition-colors ${
                isLight ? "text-slate-700" : "text-neutral-200"
              }`}>
                {feature}
              </span>
            </div>
          ))}
          {excludedFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 opacity-40">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isLight ? "bg-slate-100" : "bg-neutral-800"
              }`}>
                <Check className={`w-3.5 h-3.5 ${isLight ? "text-slate-400" : "text-neutral-600"}`} />
              </div>
              <span className={`text-sm line-through transition-colors ${
                isLight ? "text-slate-400" : "text-neutral-500"
              }`}>
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full mt-8 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 cursor-pointer shadow-md ${
          isPopular
            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-600/30"
            : isLight
            ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10"
            : "bg-neutral-800 border border-white/10 text-white hover:bg-neutral-750 hover:border-white/20"
        }`}
      >
        {btnText}
      </button>
    </div>
  );
}
