import React from "react";
import AIBillingPage from "@/features/ai_core/pages/AIBillingPage";

export interface ProfileBillingTabProps {
  credits?: number;
  hasClaimedToday?: boolean;
  handleClaimCredits?: () => void;
  claimNotification?: boolean;
  invoices?: { id: string; date: string; amount: number; status: string }[];
  streakDays?: number;
  subscriptionTier?: string;
  cardInfo?: any;
  onUpdateCard?: (card: {
    cardHolder: string;
    cardNo: string;
    cardExpiry: string;
    cardCvv: string;
  }) => Promise<void>;
  onUpgradePlan?: () => Promise<void>;
  onPurchaseCredits?: (credits: number, priceUSD: number) => Promise<void>;
  user?: any;
  fetchWithInterceptor?: any;
  addNotification?: (msg: string, type?: any) => void;
}

export default function ProfileBillingTab({
  credits,
  hasClaimedToday,
  streakDays,
  subscriptionTier,
  user,
  fetchWithInterceptor,
  addNotification,
}: ProfileBillingTabProps) {
  // Merge user object with state props
  const mergedUser = {
    ...user,
    credits: credits !== undefined ? credits : user?.credits,
    has_claimed_today:
      hasClaimedToday !== undefined ? hasClaimedToday : user?.has_claimed_today,
    streak_days:
      streakDays !== undefined ? streakDays : user?.streak_days || 1,
    subscription_tier:
      subscriptionTier !== undefined
        ? subscriptionTier
        : user?.subscription_tier || "free",
  };

  return (
    <AIBillingPage
      user={mergedUser}
      fetchWithInterceptor={fetchWithInterceptor}
      addNotification={addNotification}
    />
  );
}
