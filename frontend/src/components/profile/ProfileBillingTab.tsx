import React, { useRef } from "react";
import { Zap, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import TokenUsageDashboard from "../Feature/analytics/TokenUsageDashboard";
import {
  useBillingState,
  useCurrencyFormatter,
  useCouponCode,
  useCardInfo,
} from "./hooks";
import {
  SubscriptionPlanHeader,
  DailyStreakTracker,
  SubscriptionPlansGrid,
  CreditCalculator,
  CardPaymentForm,
  CardPreview,
} from "./billing";

interface ProfileBillingTabProps {
  credits: number;
  hasClaimedToday: boolean;
  handleClaimCredits: () => void;
  claimNotification: boolean;
  invoices: { id: string; date: string; amount: number; status: string }[];
  streakDays: number;
  subscriptionTier: string;
  cardInfo: any;
  onUpdateCard: (card: {
    cardHolder: string;
    cardNo: string;
    cardExpiry: string;
    cardCvv: string;
  }) => Promise<void>;
  onUpgradePlan: () => Promise<void>;
  onPurchaseCredits: (credits: number, priceUSD: number) => Promise<void>;
}

export default function ProfileBillingTab({
  credits,
  hasClaimedToday,
  handleClaimCredits,
  claimNotification,
  invoices,
  streakDays,
  subscriptionTier,
  cardInfo,
  onUpdateCard,
  onUpgradePlan,
  onPurchaseCredits,
}: ProfileBillingTabProps) {
  // Use custom hooks for state management
  const billing = useBillingState(cardInfo);
  const coupon = useCouponCode();
  const cardHook = useCardInfo(cardInfo);
  const formatter = useCurrencyFormatter(billing.currency, coupon.discount);

  const handleClaimClick = () => {
    handleClaimCredits();
  };

  const handleCardNoChange = (value: string) => {
    cardHook.formatCardNumber(value);
  };

  const handleCardExpiryChange = (value: string) => {
    cardHook.formatCardExpiry(value);
  };

  const handleCardCvvChange = (value: string) => {
    cardHook.formatCardCvv(value);
  };

  const handleSaveCard = async () => {
    if (!cardHook.isCardComplete()) {
      await (window as any).alertAsync("Please fill in all card details!");
      return;
    }
    await onUpdateCard({
      cardHolder: cardHook.cardHolder,
      cardNo: cardHook.cardNo,
      cardExpiry: cardHook.cardExpiry,
      cardCvv: cardHook.cardCvv,
    });
  };

  const handlePurchaseCredits = () => {
    const baseUSD = billing.customCredits * 0.02;
    const discountedPriceUSD = formatter.getDiscountedPrice(baseUSD);
    onPurchaseCredits(billing.customCredits, discountedPriceUSD);
  };

  const calculatorRef = useRef<HTMLDivElement>(null);

  const scrollToCalculator = () => {
    calculatorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Tier colours for the balance hero card
  const balanceTier =
    credits < 10
      ? { label: "Critical", ring: "ring-red-500/60", text: "text-red-400", bg: "bg-red-500/10", icon: <AlertTriangle className="w-5 h-5 text-red-400" /> }
      : credits < 50
      ? { label: "Low", ring: "ring-amber-500/50", text: "text-amber-400", bg: "bg-amber-500/10", icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> }
      : { label: "Healthy", ring: "ring-emerald-500/40", text: "text-emerald-400", bg: "bg-emerald-500/10", icon: <CheckCircle className="w-5 h-5 text-emerald-400" /> };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">

      {/* ── Credit Balance Hero Card ───────────────────────────────────────── */}
      <div className="bg-[#0f0f13]/60 border border-white/8 rounded-3xl p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-transparent pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          {/* Balance ring + number */}
          <div className="flex items-center gap-5">
            <div className={`relative flex items-center justify-center w-20 h-20 rounded-full ring-2 ${balanceTier.ring} ${balanceTier.bg} shrink-0`}>
              <Zap className={`w-8 h-8 ${balanceTier.text}`} />
              {credits < 10 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-0.5">AI Credits Balance</p>
              <p className={`text-5xl font-black tabular-nums leading-none ${balanceTier.text}`}>
                {credits.toLocaleString()}
              </p>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${balanceTier.bg} ${balanceTier.text}`}>
                {balanceTier.icon}
                {balanceTier.label}
              </div>
            </div>
          </div>

          {/* Action area */}
          <div className="flex flex-col gap-2 items-start sm:items-end shrink-0">
            <button
              onClick={scrollToCalculator}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all active:scale-95 shadow-md shadow-purple-900/20 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              Top Up Credits
            </button>
            {!hasClaimedToday && (
              <button
                onClick={handleClaimCredits}
                className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold px-5 py-2 rounded-xl text-xs transition-all cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                Claim Daily Credits
              </button>
            )}
          </div>
        </div>

        {/* Critical low-balance banner */}
        {credits < 10 && (
          <div className="relative mt-5 flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-2xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <p className="text-xs text-red-300 font-medium">
              Your balance is critically low. Some AI features are disabled until you top up.
            </p>
          </div>
        )}
      </div>

      {/* Plan details header */}
      <SubscriptionPlanHeader
        subscriptionTier={subscriptionTier}
        currency={billing.currency}
        onCurrencyChange={billing.setCurrency}
        onUpgradePlan={onUpgradePlan}
        formatPrice={formatter.formatPrice}
      />

      {/* Streak Tracker */}
      <div className="bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />
        <DailyStreakTracker
          hasClaimedToday={hasClaimedToday}
          streakDays={streakDays}
          onClaimClick={handleClaimClick}
          claimNotification={claimNotification}
        />
      </div>

      {/* Subscriptions Grid & Coupon Code Box */}
      <SubscriptionPlansGrid
        subscriptionTier={subscriptionTier}
        formatPrice={formatter.formatPrice}
        couponCode={coupon.couponCode}
        setCouponCode={coupon.setCouponCode}
        couponStatus={coupon.couponStatus}
        onApplyCoupon={coupon.handleApplyCoupon}
      />

      {/* Credit Calculator (scroll target for Top Up button) */}
      <div ref={calculatorRef}>
        <CreditCalculator
          customCredits={billing.customCredits}
          onCreditsChange={billing.setCustomCredits}
          formatCustomPrice={formatter.formatCustomPrice}
          onPurchase={handlePurchaseCredits}
        />
      </div>

      {/* Card Payment Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0f0f13]/40 border border-white/5 rounded-3xl p-8 shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

        {/* Card Form */}
        <CardPaymentForm
          cardHolder={cardHook.cardHolder}
          setCardHolder={cardHook.setCardHolder}
          cardNo={cardHook.cardNo}
          onCardNoChange={handleCardNoChange}
          cardExpiry={cardHook.cardExpiry}
          onCardExpiryChange={handleCardExpiryChange}
          cardCvv={cardHook.cardCvv}
          onCardCvvChange={handleCardCvvChange}
          onSaveCard={handleSaveCard}
          isComplete={cardHook.isCardComplete()}
        />

        {/* Card Preview */}
        <CardPreview
          cardNo={cardHook.cardNo}
          cardHolder={cardHook.cardHolder}
          cardExpiry={cardHook.cardExpiry}
        />
      </div>

      {/* Token Usage Ledger */}
      <div className="w-full">
        <TokenUsageDashboard />
      </div>
    </div>
  );
}
