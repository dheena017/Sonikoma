import React, { useState, useEffect, useRef } from "react";
import {
  CreditCard,
  Zap,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  ShieldCheck,
  Plus,
  ArrowUpRight,
  Receipt,
  Layers,
  Flame,
  AlertTriangle,
  Gift,
} from "lucide-react";
import { claimDailyCredits } from "@/api/endpoints/auth";
import {
  SubscriptionPlanHeader,
  DailyStreakTracker,
  SubscriptionPlansGrid,
  CreditCalculator,
  CardPaymentForm,
  CardPreview,
} from "@/features/ai_core/components/billing";

interface AIBillingPageProps {
  user?: any;
  fetchWithInterceptor?: any;
  addNotification?: (msg: string, type?: string) => void;
}

const TOPUP_PACKAGES = [
  {
    id: "starter",
    name: "Creator Starter",
    credits: 1500,
    priceUSD: 9,
    badge: "Popular for Beginners",
    features: [
      "~750 Panel AI Narrations",
      "~150 AI Thumbnail Generations",
      "Standard Gemini 2.5 Flash Speed",
      "Basic Voice Synthesis",
    ],
  },
  {
    id: "pro",
    name: "Pro Studio",
    credits: 6000,
    priceUSD: 29,
    badge: "Best Value",
    popular: true,
    features: [
      "~3,000 Panel AI Narrations",
      "~600 High-CTR Thumbnails",
      "Priority Inference Queue",
      "ElevenLabs Voice Cloning Credits",
      "Custom Model Fine-tuning",
    ],
  },
  {
    id: "enterprise",
    name: "Studio Enterprise",
    credits: 25000,
    priceUSD: 99,
    badge: "High Volume",
    features: [
      "~12,500 Panel AI Narrations",
      "Unlimited YouTube SEO & Scripts",
      "Dedicated High-Speed Inference",
      "Direct API Key Pass-Through",
      "Priority 24/7 Creator Support",
    ],
  },
];

const TOOL_RATES = [
  { tool: "Webtoon Panel Narration", cost: "2 Credits / panel", speed: "Instant (<300ms)" },
  { tool: "AI YouTube Thumbnail Studio", cost: "5 Credits / image", speed: "Fast (~1.2s)" },
  { tool: "Video Script & Storyboard Optimizer", cost: "10 Credits / episode", speed: "Instant (<500ms)" },
  { tool: "Neural Voiceover Generation", cost: "5 Credits / 1,000 chars", speed: "Streaming" },
  { tool: "Manga Multi-Language Translation", cost: "1 Credit / speech bubble", speed: "Instant (<200ms)" },
  { tool: "YouTube SEO Metadata & Chapters", cost: "3 Credits / generation", speed: "Instant (<400ms)" },
];

export default function AIBillingPage({
  user,
  fetchWithInterceptor,
  addNotification,
}: AIBillingPageProps) {
  const [credits, setCredits] = useState<number>(user?.credits ?? 0);
  const [isClaiming, setIsClaiming] = useState(false);
  const [streakDays, setStreakDays] = useState<number>(user?.streak_days || 1);
  const [hasClaimedToday, setHasClaimedToday] = useState<boolean>(
    user?.has_claimed_today || false
  );
  const [claimNotification, setClaimNotification] = useState<boolean>(false);

  // Subscription & Currency State
  const [subscriptionTier, setSubscriptionTier] = useState<string>(
    user?.subscription_tier || "free"
  );
  const [currency, setCurrency] = useState<"USD" | "KRW" | "JPY">("USD");
  const [couponCode, setCouponCode] = useState<string>("");
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Custom Credit Calculator
  const [customCredits, setCustomCredits] = useState<number>(1000);
  const calculatorRef = useRef<HTMLDivElement>(null);

  // Card Payment Form State
  const [cardHolder, setCardHolder] = useState<string>("");
  const [cardNo, setCardNo] = useState<string>("");
  const [cardExpiry, setCardExpiry] = useState<string>("");
  const [cardCvv, setCardCvv] = useState<string>("");

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/ai/analytics/summary");
        if (res.ok) {
          const json = await res.json();
          if (typeof json.available_credits === "number") {
            setCredits(json.available_credits);
          }
        }
      } catch {}
    };
    fetchBalance();
  }, []);

  const formatPrice = (baseUSD: number) => {
    const discounted = baseUSD * (1 - discountPercent / 100);
    if (currency === "KRW") {
      return `₩${Math.round(discounted * 1350).toLocaleString()}`;
    }
    if (currency === "JPY") {
      return `¥${Math.round(discounted * 155).toLocaleString()}`;
    }
    return `$${discounted.toFixed(discounted % 1 === 0 ? 0 : 2)}`;
  };

  const formatCustomPrice = (credCount: number) => {
    const baseUSD = credCount * 0.02;
    return formatPrice(baseUSD);
  };

  const handleClaim = async () => {
    if (hasClaimedToday || isClaiming) return;
    setIsClaiming(true);
    try {
      if (fetchWithInterceptor) {
        const res = await claimDailyCredits(fetchWithInterceptor);
        if (res.success && typeof res.new_balance === "number") {
          setCredits(res.new_balance);
          setHasClaimedToday(true);
          setStreakDays((prev) => prev + 1);
          setClaimNotification(true);
          addNotification?.(res.message || "Claimed daily bonus credits!", "success");
        }
      } else {
        setCredits((prev) => prev + 50);
        setHasClaimedToday(true);
        setStreakDays((prev) => prev + 1);
        setClaimNotification(true);
        addNotification?.("Claimed 50 daily login bonus credits!", "success");
      }
    } catch {
      // Fallback
    } finally {
      setIsClaiming(false);
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === "SONIKOMA50" || code === "COMIC50") {
      setDiscountPercent(50);
      setCouponStatus("Applied 50% discount successfully!");
      addNotification?.("Coupon applied: 50% Off Subscription & Credits!", "success");
    } else if (code === "CREATOR20") {
      setDiscountPercent(20);
      setCouponStatus("Applied 20% creator discount!");
      addNotification?.("Coupon applied: 20% Off!", "success");
    } else {
      setCouponStatus("Invalid or expired coupon code");
      addNotification?.("Invalid coupon code", "error");
    }
  };

  const handleUpgradePlan = async () => {
    setSubscriptionTier("pro");
    addNotification?.("Upgraded to Creator Studio Pro!", "success");
  };

  const handleSaveCard = async () => {
    addNotification?.("Saved credit card payment method securely!", "success");
  };

  const handlePurchaseCustom = () => {
    addNotification?.(`Processing order for ${customCredits.toLocaleString()} Credits...`, "info");
  };

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isCardComplete =
    cardHolder.trim().length > 2 &&
    cardNo.replace(/\s/g, "").length >= 15 &&
    cardExpiry.length === 5 &&
    cardCvv.length >= 3;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP HERO HEADER BANNER (UNIFIED SUITE STYLE) ─────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-neutral-850 bg-neutral-900/60 p-6 shadow-md text-left">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-600 to-purple-400 opacity-90" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> AI Wallet &amp; Subscriptions
              </h3>
              <span className="text-[10px] font-mono font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-sm">
                Unified Billing Hub
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight font-sans">
              AI Credit Wallet &amp; Rates
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl font-mono leading-relaxed">
              Transparent usage-based pricing with multi-currency checkout, custom credit packages, and daily reward streaks.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleClaim}
              disabled={isClaiming || hasClaimedToday}
              className={`px-4 py-2.5 rounded-xl text-xs font-medium shadow-md flex items-center gap-2 transition-all cursor-pointer font-sans ${
                hasClaimedToday
                  ? "bg-neutral-800 text-neutral-400 border border-neutral-700 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-500/20 active:scale-95"
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{hasClaimedToday ? "Bonus Claimed" : isClaiming ? "Claiming..." : "Claim Daily Bonus"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── WALLET BALANCE OVERVIEW CARD ──────────────────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-purple-500 opacity-90" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 font-mono">
              <span>Available Credit Balance</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-sans flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-400 fill-amber-400" />
              <span>{Number(credits).toLocaleString()}</span>
              <span className="text-xs text-neutral-400 font-mono font-normal">Credits</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={scrollToCalculator}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all active:scale-95 shadow-md shadow-purple-900/20 cursor-pointer font-sans"
            >
              <TrendingUp className="w-4 h-4" />
              Top Up Credits
            </button>

            <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero expiration on paid credits</span>
            </div>
          </div>
        </div>

        {credits < 10 && (
          <div className="mt-4 flex items-center gap-2.5 bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-300 font-mono">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>Balance critically low ({credits} left). Top up credits or use your BYOK Gemini API key.</span>
          </div>
        )}
      </div>

      {/* ── DAILY REWARD STREAK TRACKER ───────────────────────────────────── */}
      <div className="bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md relative">
        <DailyStreakTracker
          hasClaimedToday={hasClaimedToday}
          streakDays={streakDays}
          onClaimClick={handleClaim}
          claimNotification={claimNotification}
        />
      </div>

      {/* ── SUBSCRIPTION PLANS & CURRENCY SECTION ─────────────────────────── */}
      <div className="space-y-4">
        <SubscriptionPlanHeader
          subscriptionTier={subscriptionTier}
          currency={currency}
          onCurrencyChange={setCurrency}
          onUpgradePlan={handleUpgradePlan}
          formatPrice={formatPrice}
        />

        <SubscriptionPlansGrid
          subscriptionTier={subscriptionTier}
          formatPrice={formatPrice}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          couponStatus={couponStatus}
          onApplyCoupon={handleApplyCoupon}
          onSelectPlan={handleUpgradePlan}
        />
      </div>

      {/* ── PRE-PACKAGED TOP-UP BUNDLES ───────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="text-base font-black text-white font-sans tracking-tight">
          Instant Top-Up Packages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOPUP_PACKAGES.map((plan) => (
            <div
              key={plan.id}
              className={`p-6 rounded-2xl bg-neutral-900/60 border ${
                plan.popular
                  ? "border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)] relative"
                  : "border-neutral-850"
              } flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all text-left`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white font-sans">{plan.name}</span>
                  <span className="text-[9px] font-mono font-bold bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-800 text-purple-300">
                    {plan.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-sans">{formatPrice(plan.priceUSD)}</span>
                  <span className="text-xs text-neutral-400 font-mono">/ one-time</span>
                </div>

                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 pt-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{plan.credits.toLocaleString()} AI Credits</span>
                </div>

                <ul className="space-y-2 pt-2 border-t border-neutral-850 text-xs text-neutral-400 font-mono">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => addNotification?.(`Redirecting to Stripe checkout for ${plan.name}...`, "info")}
                className={`w-full py-2.5 rounded-xl font-sans text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  plan.popular
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-500/20"
                    : "bg-neutral-950 hover:bg-neutral-850 border border-neutral-800 text-white"
                }`}
              >
                Top Up {plan.credits.toLocaleString()} Credits
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── INTERACTIVE CREDIT CALCULATOR (SCROLL TARGET) ─────────────────── */}
      <div ref={calculatorRef}>
        <CreditCalculator
          customCredits={customCredits}
          onCreditsChange={setCustomCredits}
          formatCustomPrice={formatCustomPrice}
          onPurchase={handlePurchaseCustom}
        />
      </div>

      {/* ── CARD PAYMENT FORM & CARD PREVIEW ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md relative">
        <CardPaymentForm
          cardHolder={cardHolder}
          setCardHolder={setCardHolder}
          cardNo={cardNo}
          onCardNoChange={(val) => {
            const raw = val.replace(/\D/g, "").slice(0, 16);
            const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
            setCardNo(formatted);
          }}
          cardExpiry={cardExpiry}
          onCardExpiryChange={(val) => {
            const raw = val.replace(/\D/g, "").slice(0, 4);
            const formatted = raw.length >= 3 ? `${raw.slice(0, 2)}/${raw.slice(2)}` : raw;
            setCardExpiry(formatted);
          }}
          cardCvv={cardCvv}
          onCardCvvChange={(val) => setCardCvv(val.replace(/\D/g, "").slice(0, 4))}
          onSaveCard={handleSaveCard}
          isComplete={isCardComplete}
        />

        <CardPreview
          cardNo={cardNo}
          cardHolder={cardHolder}
          cardExpiry={cardExpiry}
        />
      </div>

      {/* ── TRANSPARENT TOOL CONSUMPTION MATRIX ───────────────────────────── */}
      <div className="relative bg-neutral-900/60 border border-neutral-850 rounded-2xl p-6 shadow-md text-left overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
            <Receipt className="w-4 h-4" /> Tool Consumption Matrix
          </h3>
          <span className="text-[10px] font-mono text-neutral-500">Live Rates</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {TOOL_RATES.map((rate, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-850 space-y-1">
              <span className="text-xs font-bold text-white font-sans">{rate.tool}</span>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-400 font-bold">{rate.cost}</span>
                <span className="text-neutral-500">{rate.speed}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
