import React from "react";
import { Ticket } from "lucide-react";

interface SubscriptionPlansGridProps {
  subscriptionTier: string;
  formatPrice: (baseUSD: number) => string;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponStatus: string | null;
  onApplyCoupon: (e: React.FormEvent) => void;
}

export default function SubscriptionPlansGrid({
  subscriptionTier,
  formatPrice,
  couponCode,
  setCouponCode,
  couponStatus,
  onApplyCoupon,
}: SubscriptionPlansGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Free Plan */}
      <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
            Free Tier
          </span>
          {subscriptionTier !== "pro" ? (
            <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 rounded-full font-bold">
              Active
            </span>
          ) : (
            <span className="text-[10px] text-neutral-550 font-bold">
              Legacy
            </span>
          )}
        </div>
        <div className="text-2xl font-black text-white">{formatPrice(0)}</div>
        <ul className="text-[11px] text-neutral-400 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
          <li>Up to 10 webtoon strip scrapes / day</li>
          <li>Row-wise background panel segmentation</li>
          <li>Standard voice synthesizing nodes</li>
        </ul>
      </div>

      {/* Pro Plan */}
      <div className="bg-gradient-to-b from-[#121218]/80 to-[#070709]/80 border border-purple-500/20 rounded-3xl p-6 text-left space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400">
            Studio Pro
          </span>
          {subscriptionTier === "pro" ? (
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 rounded-full font-bold">
              Active
            </span>
          ) : (
            <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 rounded-full font-bold">
              Recommended
            </span>
          )}
        </div>
        <div className="text-2xl font-black text-white">{formatPrice(19)}</div>
        <ul className="text-[11px] text-neutral-300 space-y-2 list-disc pl-4 leading-relaxed font-bold">
          <li>Unlimited vertical scrapers & compiles</li>
          <li>1080p / 4K Ultra-HD video compilation</li>
          <li>Advanced character profiles & translation</li>
        </ul>
      </div>

      {/* Coupon Promo code form */}
      <div className="bg-black/30 border border-white/5 rounded-3xl p-6 text-left space-y-4 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500 flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
            Promo Coupons
          </span>
          <p className="text-[10px] text-neutral-500 font-semibold leading-relaxed">
            Enter coupon code to unlock premium subscription discounts
          </p>
        </div>

        <form onSubmit={onApplyCoupon} className="space-y-2">
          <input
            type="text"
            required
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. COMIC50"
            className="w-full bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-700 uppercase"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-[10px] transition-all cursor-pointer"
          >
            Apply Coupon
          </button>
        </form>

        {couponStatus && (
          <div
            className={`text-[10px] font-bold ${
              couponStatus.includes("Applied")
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            {couponStatus}
          </div>
        )}
      </div>
    </div>
  );
}
