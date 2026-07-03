import React from "react";
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-left">
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

      {/* Credit Calculator */}
      <CreditCalculator
        customCredits={billing.customCredits}
        onCreditsChange={billing.setCustomCredits}
        formatCustomPrice={formatter.formatCustomPrice}
        onPurchase={handlePurchaseCredits}
      />

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
