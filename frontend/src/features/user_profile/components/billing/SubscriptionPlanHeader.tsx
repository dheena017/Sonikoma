import React from "react";
import { Plus } from "lucide-react";

interface SubscriptionPlanHeaderProps {
  subscriptionTier: string;
  currency: "USD" | "KRW" | "JPY";
  onCurrencyChange: (currency: "USD" | "KRW" | "JPY") => void;
  onUpgradePlan: () => Promise<void>;
  formatPrice: (baseUSD: number) => string;
}

export default function SubscriptionPlanHeader({
  subscriptionTier,
  currency,
  onCurrencyChange,
  onUpgradePlan,
  formatPrice,
}: SubscriptionPlanHeaderProps) {
  return (
    <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="space-y-1">
          <span className="text-[9px] font-extrabold text-[#3B82F6] uppercase tracking-widest bg-[#3B82F6]/10 border border-[#3B82F6]/20 px-2 py-0.5 rounded-full">
            Subscription Plan
          </span>
          <h3 className="text-2xl font-black text-white">
            {subscriptionTier === "pro"
              ? "Creator Studio Pro Tier"
              : "Creator Studio Free Tier"}
          </h3>
          <p className="text-xs text-neutral-500 font-semibold">
            {subscriptionTier === "pro"
              ? "Includes unlimited vertical compilations, 1080p/4K HD outputs, and advanced OCR tools"
              : "Includes 1000 rendering credits per month with core scraping tools"}
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Currency toggle */}
          <div className="flex items-center gap-1 bg-neutral-900 border border-white/5 p-1 rounded-xl">
            {(["USD", "KRW", "JPY"] as const).map((curr) => (
              <button
                key={curr}
                onClick={() => onCurrencyChange(curr)}
                className={`py-1 px-2.5 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                  currency === curr
                    ? "bg-[#2A2A2A] border border-[#3B82F6]/30 text-[#3B82F6]"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {subscriptionTier === "pro" ? (
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5 rounded-xl font-mono">
              ✓ Current Plan
            </span>
          ) : (
            <button
              onClick={onUpgradePlan}
              className="bg-[#2A2A2A] hover:bg-[#3B82F6] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-black/50 text-xs flex items-center gap-1.5 cursor-pointer active:scale-95 duration-300"
            >
              <Plus className="w-4 h-4" />
              Upgrade to Studio Pro
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
