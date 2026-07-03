import React from "react";
import { Check } from "lucide-react";

interface PricingCardProps {
  title: string;
  price: number;
  desc: string;
  features: string[];
  excludedFeatures: string[];
  isPopular?: boolean;
  btnText: string;
  onClick: () => void;
}

export function PricingCard({
  title,
  price,
  desc,
  features,
  excludedFeatures,
  isPopular = false,
  btnText,
  onClick,
}: PricingCardProps) {
  return (
    <div
      className={`p-8 rounded-[32px] bg-neutral-900/50 border transition-all flex flex-col justify-between relative group ${
        isPopular
          ? "border-purple-500 bg-neutral-900/80 shadow-xl shadow-purple-650/5"
          : "border-white/5 hover:border-white/10"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider shadow-lg">
          Most Popular
        </span>
      )}
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-black mb-2">{title}</h3>
          <p className="text-neutral-500 text-sm">{desc}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black">${price}</span>
          <span className="text-neutral-500">/month</span>
        </div>
        <div className="border-t border-white/5 pt-6 space-y-4">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-neutral-300">{feature}</span>
            </div>
          ))}
          {excludedFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-3 opacity-50">
              <Check className="w-4 h-4 text-neutral-600 shrink-0" />
              <span className="text-sm text-neutral-500">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={onClick}
        className={`w-full mt-8 py-4 rounded-2xl text-sm font-black transition-all active:scale-95 cursor-pointer ${
          isPopular
            ? "bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-650/20"
            : "bg-neutral-805 border border-white/5 text-neutral-200 hover:bg-neutral-700 hover:text-white"
        }`}
      >
        {btnText}
      </button>
    </div>
  );
}
