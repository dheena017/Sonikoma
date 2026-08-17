import React from "react";
import { Ticket, CheckCircle2, Zap } from "lucide-react";

export interface SubscriptionPlansGridProps {
  subscriptionTier: string;
  formatPrice?: (baseUSD: number) => string;
  couponCode: string;
  setCouponCode: (code: string) => void;
  couponStatus: string | null;
  onApplyCoupon: (e: React.FormEvent) => void;
  onSelectPlan?: (tier: string) => void;
}

export const SubscriptionPlansGrid: React.FC<SubscriptionPlansGridProps> = ({
  subscriptionTier,
  formatPrice = (val) => `$${val}`,
  couponCode,
  setCouponCode,
  couponStatus,
  onApplyCoupon,
  onSelectPlan,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Free Plan */}
      <div className="bg-[#0f0f13]/50 border border-white/5 rounded-3xl p-6 text-left space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-500">
              Free Tier
            </span>
            {subscriptionTier !== "pro" ? (
              <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 rounded-full font-bold">
                Active
              </span>
            ) : (
              <span className="text-[10px] text-neutral-500 font-bold">
                Standard
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-white">{formatPrice(0)}</div>
          <ul className="text-[11px] text-neutral-400 space-y-2 list-disc pl-4 leading-relaxed font-semibold">
            <li>Up to 10 webtoon strip scrapes / day</li>
            <li>Row-wise background panel segmentation</li>
            <li>Standard voice synthesizing nodes</li>
            <li>1,000 monthly credits grant</li>
          </ul>
        </div>
      </div>

      {/* Pro Plan */}
      <div className="bg-gradient-to-b from-[#121218]/90 to-[#070709]/90 border border-purple-500/30 rounded-3xl p-6 text-left space-y-4 shadow-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-purple-400 flex items-center gap-1">
              <Zap className="w-3 h-3 fill-purple-400" /> Studio Pro
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
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{formatPrice(19)}</span>
            <span className="text-xs text-neutral-400 font-mono">/ mo</span>
          </div>
          <ul className="text-[11px] text-neutral-300 space-y-2 leading-relaxed font-semibold">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Unlimited vertical scrapers & compiles</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>1080p / 4K Ultra-HD video compilation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>Priority AI inference & ElevenLabs sync</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span>6,000 monthly credits included</span>
            </li>
          </ul>
        </div>

        {subscriptionTier !== "pro" && onSelectPlan && (
          <button
            type="button"
            onClick={() => onSelectPlan("pro")}
            className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-purple-600/30 active:scale-95 cursor-pointer mt-2"
          >
            Upgrade to Pro ($19/mo)
          </button>
        )}
      </div>

      {/* Coupon Promo code form */}
      <div className="bg-[#0f0f13]/50 border border-white/5 rounded-3xl p-6 text-left space-y-4 flex flex-col justify-between">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-wider uppercase text-neutral-400 flex items-center gap-1">
            <Ticket className="w-3.5 h-3.5 text-purple-400" />
            Promo Coupons
          </span>
          <p className="text-[10px] text-neutral-400 font-semibold leading-relaxed">
            Enter coupon code to unlock creator subscription discounts.
          </p>
        </div>

        <form onSubmit={onApplyCoupon} className="space-y-2">
          <input
            type="text"
            required
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="e.g. SONIKOMA50"
            className="w-full bg-black/40 border border-white/10 focus:border-purple-500/50 rounded-xl py-2 px-3 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-600/20 transition-all placeholder:text-neutral-600 uppercase font-mono"
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm active:scale-95"
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
};

export default SubscriptionPlansGrid;
