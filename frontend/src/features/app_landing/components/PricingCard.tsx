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
      className={`p-7 rounded-[28px] border transition-all duration-300 flex flex-col justify-between relative hover:-translate-y-1.5 cursor-pointer ${
        isPopular
          ? isLight
            ? "border-blue-500 bg-blue-50/60 shadow-lg hover:border-blue-600 hover:shadow-xl"
            : "border-blue-500 bg-[#161922] shadow-xl hover:border-blue-400 hover:shadow-blue-950/40"
          : isLight
          ? "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md shadow-sm"
          : "border-[#2F2F2F] bg-[#181818] hover:border-neutral-600 hover:shadow-xl shadow-md"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" />
          Most Popular
        </span>
      )}
      <div className="space-y-5">
        <div>
          <h3
            className={`text-xl font-bold mb-1.5 transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            {title}
          </h3>
          <p
            className={`text-sm leading-relaxed transition-colors ${
              isLight ? "text-slate-700" : "text-neutral-400"
            }`}
          >
            {desc}
          </p>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`text-4xl font-black tracking-tight transition-colors ${
              isLight ? "text-slate-950" : "text-white"
            }`}
          >
            {typeof price === "number" ? `$${price}` : price}
          </span>
          <span
            className={`text-sm font-medium transition-colors ${
              isLight ? "text-slate-600" : "text-neutral-400"
            }`}
          >
            {billingPeriod}
          </span>
        </div>
        <div
          className={`border-t pt-5 space-y-3 transition-colors ${
            isLight ? "border-slate-200" : "border-[#2F2F2F]"
          }`}
        >
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <span
                className={`text-sm font-medium transition-colors ${
                  isLight ? "text-slate-800" : "text-neutral-200"
                }`}
              >
                {feature}
              </span>
            </div>
          ))}
          {excludedFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  isLight ? "bg-slate-100" : "bg-[#0E0E0E]"
                }`}
              >
                <Check
                  className={`w-3.5 h-3.5 ${
                    isLight ? "text-slate-400" : "text-neutral-600"
                  }`}
                />
              </div>
              <span
                className={`text-sm line-through transition-colors ${
                  isLight ? "text-slate-500" : "text-neutral-500"
                }`}
              >
                {feature}
              </span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full mt-7 py-3 rounded-xl text-sm font-bold transition-all duration-200 active:scale-95 cursor-pointer shadow-sm ${
          isPopular
            ? "bg-blue-600 hover:bg-blue-500 text-white hover:shadow-md hover:shadow-blue-500/20"
            : isLight
            ? "bg-slate-900 text-white hover:bg-slate-800"
            : "bg-[#0E0E0E] border border-[#2F2F2F] text-white hover:bg-[#222] hover:border-neutral-600"
        }`}
      >
        {btnText}
      </button>
    </div>
  );
}
